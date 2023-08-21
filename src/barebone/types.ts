/* eslint-disable  @typescript-eslint/no-explicit-any */
export interface StoreOptions<
  State,
  Name extends string,
  UserDefinedActions extends Actions<State>,
  UserDefinedActionsAsync extends AsyncActions<State>,
> {
  /**
   * A name use to identify the store. This value is also
   * use as an identifier on the store to retrieve the state.
   */
  name: Name;

  /** The initial state of the store. */
  initialState: State;
  /**
   * Functions use for manipulate the store, the first param
   * is the state and it accepts any number of additional params
   * for passing in data when the action is called.
   *
   * Action functions must return a new state and not
   * just mutating the existing state.
   *
   * For async functions, use `options.asyncActions`.
   *
   * @example
   * //Setting the counter to a specific value. and
   * //incrementing a counter.
   * {
   *   setCounter: (state, value: number) => {
   *      return value;
   *   },
   *   increment: (state) => state + 1;
   * }
   */
  actions?: UserDefinedActions;

  /**
   * For async actions, the first two params in the function
   * is a callback function and the state, the callback function
   * is use to update the store once the new state is ready.
   *
   * Async actions accepts any number of additional params
   * for passing in data when the action is called.
   *
   * @example
   * {
   *   // Make a HTTP request for a new counter value.
   *   setCounterAsync: async (setState, state, url: string) => {
          const request = await fetch(url).json();
          setState(request.count);
   *   },
   * }
   */
  asyncActions?: UserDefinedActionsAsync;
}

// Number of default params in each type of action.
type SyncPramCount = 0 | 1;
type AsyncParamCount = SyncPramCount | 2;

// different types of actions.
export enum ActionTypes {
  /** sync actions */
  sync = 1,
  /** async actions */
  async = 2,
}

/**
 * Type for user defined functions to manipulate the state.
 */
export interface Actions<State = any> {
  [key: string]: (state: State, ...payload: any[]) => State;
}

export interface AsyncActions<State = any> {
  [key: string]: (
    setState: SetState<State>,
    state: State,
    ...payload: any[]
  ) => Promise<void>;
}

export type SetState<State> = (state: State) => void;

/** Remove the first item on an array. */
type RemoveFirstItem<T extends unknown[]> = T extends [any, ...infer U]
  ? U
  : never;

/** Remove first two items on array. */
export type RemoveFirstTwoItem<T extends unknown[]> = T extends [
  any,
  any,
  ...infer U,
]
  ? U
  : never;

/**
 * Remove the first N items on an array.
 *
 * To construct the type, items are removed
 * one at a time from the target array and added
 * to a second array until the length of the second
 * array equals N. Whatever is left in the target
 * array is then returned.
 */
export type RemoveFirstNItem<
  Target extends unknown[],
  N extends number,
  T extends unknown[] = [],
> = T['length'] extends N
  ? Target
  : T['length'] extends 0
  ? never
  : Target extends [infer M, ...infer Rest]
  ? RemoveFirstNItem<Rest, N, [M, ...T]>
  : never;

/**
 * Remove default params from sync actions leaving
 * only user defined params.
 */
export type ProcessedAction<
  Action extends (...args: any) => any,
  N extends number,
  Params extends any[] = Parameters<Action>,
> = Params['length'] extends N
  ? () => void
  : (...payload: RemoveFirstItem<Params>) => void;

/**
 * Remove default params from async actions leaving
 * only user defined params.
 */
export type ProcessAsyncAction<
  Action extends (...args: any) => Promise<any>,
  N extends number,
  Params extends any[] = Parameters<Action>,
> = Params['length'] extends N
  ? () => Promise<void>
  : (...payload: RemoveFirstTwoItem<Params>) => Promise<void>;

/** Map to keep track of listeners. */
export type StateListeners<State> = Map<
  unknown,
  {
    /** Updates the state of a component using the store
     * hook and causing a rerender.
     */
    setState: (state: any) => void;
    /**
     * Check to see if the listener's state should be
     * updated or not.
     * @param oldState The old store state.
     * @param newState The new store state.
     * @returns Whether the state for this listener should
     * be updated or not.
     */
    equalFn?: (oldState: State, newState: State) => boolean;
  }
>;

export type EqualityFn<State> = (newState: State, oldState: State) => boolean;

/**
 * Type for the actions available from the store.
 *
 * Uses the types of the user defined actions during store
 * creation to create the final type.
 *
 * Use IsSync to differentiate between sync and
 * Async actions.
 */
export type StoreActions<
  ActionsCollection extends Actions,
  ActionType extends ActionTypes,
> = {
  [key in keyof ActionsCollection]: ActionType extends ActionTypes.sync
    ? ProcessedAction<ActionsCollection[key], SyncPramCount>
    : ProcessAsyncAction<ActionsCollection[key], AsyncParamCount>;
};

/**
 * Type for the function to retrieving actions from the store.
 *
 * Uses the type of the select function that is accepted by
 * the actions function to get the final return type.
 */
export type useActionsHook<SelectFn extends (...args: any) => any> = (
  select: SelectFn,
) => ReturnType<SelectFn>;

/** The state of the store */
export type store<Name extends string = string, S = any> = { [key in Name]: S };
