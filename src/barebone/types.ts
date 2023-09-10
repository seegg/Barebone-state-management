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
   * Functions use for manipulating the store, the first param
   * is always the state and it accepts any number of additional
   * params for passing in data when the action is called.
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
   * For async actions, the first param instead of being the 
   * state it's a function that returns the current state when
   * called. This is so that the latest store state is always
   * available inside the async function.
   *
   * Async actions accepts any number of additional params
   * for passing in data when the action is called.
   *
   * @example
   * {
   *   // Make a HTTP request for a new counter value.
   *   setCounterAsync: async (getState, url: string) => {
          const request = await fetch(url).json();
          return request.count;
   *   },
   * }
   */
  asyncActions?: UserDefinedActionsAsync;
}

// Number of default params in each type of action.
type SyncDefaultPramCount = 1;
type AsyncDefaultParamCount = 1;

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
  [key: string]: SyncAction<State>;
}

export type SyncAction<State> = (state: State, ...payload: any[]) => State;

export interface AsyncActions<State = any> {
  [key: string]: AsyncAction<State>;
}

export type AsyncAction<State> = (
  getState: () => State,
  ...payload: any[]
) => Promise<State>;

export type SetState<State> = (state: State) => void;

/** Remove the first item on an array.*/
type RemoveFirstItem<T extends unknown[]> = T['length'] extends 0
  ? T
  : T extends [any, ...infer U]
  ? U
  : never;

/** Remove first two items on array. */
export type RemoveFirstTwoItem<T extends unknown[]> = T['length'] extends 0 | 1
  ? T
  : T extends [any, any, ...infer U]
  ? U
  : never;

/**
 * Remove the first N items on an array.
 *
 * Items are removed from the target array and added to
 * a second array until either the length of the second
 * array equals or the target array is empty.
 *
 */
export type RemoveFirstNItems<
  Target extends unknown[],
  N extends number,
  T extends unknown[] = [],
> = Target['length'] extends 0
  ? Target
  : T['length'] extends N
  ? Target
  : Target extends [infer M, ...infer Rest]
  ? RemoveFirstNItems<Rest, N, [M, ...T]>
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
  : (...payload: RemoveFirstItem<Params>) => Promise<void>;

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
    ? ProcessedAction<ActionsCollection[key], SyncDefaultPramCount>
    : ProcessAsyncAction<ActionsCollection[key], AsyncDefaultParamCount>;
};

/** The state of the store */
export type Store<Name extends string = string, S = any> = { [key in Name]: S };

/**
 * Actions for manipulating the store.
 */
export type CreateActionsResult<
  ActionsSync extends Actions,
  ActionsAsync extends AsyncActions,
> = {
  /**
   * Actions for performing synchronous updates on the store.
   */
  actions: StoreActions<ActionsSync, ActionTypes.sync>;
  /**
   * Actions for performing asynchronous updates on the store.
   */
  asyncActions: StoreActions<ActionsAsync, ActionTypes.async>;
};

export type UseStoreHook<Store, SelectFn extends (state: Store) => any> = (
  select: SelectFn,
  equalFn?: EqualityFn<Store>,
) => ReturnType<SelectFn>;

export type CreateStoreResult<
  State,
  Name extends string,
  SelectFn extends (state: Store<Name, State>) => any,
  ActionOption extends Actions<State>,
  AsyncActionOption extends AsyncActions<State>,
> = {
  /**
   * Hook use for accessing the store.
   * @param select Function that accepts the store state as argument
   * and can be use to narrow down what is returned from the store.
   * @param equalFn Optional function to determine if the local state
   * should be updated when the store updates.
   * @returns The property selected in the select function.
   */
  useStore: <StoreSelect extends SelectFn>(
    select: StoreSelect,
    equalFn?: EqualityFn<Store<Name, State>>,
  ) => ReturnType<StoreSelect>;

  /** The store. Don't update the state here directly, use actions. */
  store: Store<Name, State>;
} & CreateActionsResult<ActionOption, AsyncActionOption>;
