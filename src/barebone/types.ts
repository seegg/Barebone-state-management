/* eslint-disable  @typescript-eslint/no-explicit-any */
export interface StoreOptions<
  State = any,
  Name extends string = string,
  A extends Actions<State> = any,
> {
  /**
   * A name use to identify the store.
   */
  name: Name extends 'state' | 'actions' ? never : Name;
  /** The initial state of the store. */
  initialState: State;
  /**
   * Functions use to manipulate the state, the state is
   * pass in as the first argument and it optionally accepts
   * a second user define argument.
   *
   * Actions must return a new state.
   *
   * @example
   * //Setting a counter to a specific value. and
   * //incrementing a counter.
   * {
   *   setCounter: (state, value: number) => {
   *      return value;
   *   },
   *   increment: (state) => state + 1;
   * }
   */
  actions: A;
}

/**
 * Functions for manipulating the state.
 */
export interface Actions<State = any> {
  [key: string]: (state: State, payload?: any) => State;
}

/**
 * Maps the actions function to a wrapper where the
 * first argument(state) is removed.
 */
export type ActionsWithoutState<T extends Actions> = {
  /** Functions for manipulating the state. */
  actions: {
    [key in keyof T]: Parameters<T[key]>['length'] extends 2
      ? (payload: Parameters<T[key]>[1]) => Parameters<T[key]>[0]
      : () => Parameters<T[key]>[0];
  };
};

/**
 * Extracts the name from the store options and
 * creates property with the name as key and the state
 * as the value.
 */
export type ExtractStoreName<Name extends string, State> = {
  [key in Name]: State;
};

/** Keeps track of the states in components that are using the store. */
export type StateListener = Map<unknown, (state: any) => void>;
/** The state of the store */
export type State<Name extends string = string, S = any> = { [key in Name]: S };

export type CreateStoreResults<
  S,
  N extends string,
  A extends Actions<S>,
> = ExtractStoreName<N, S> & ActionsWithoutState<A>;