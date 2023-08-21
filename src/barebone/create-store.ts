import { useState } from 'react';
import type {
  Actions,
  StoreOptions,
  Store,
  StateListeners,
  EqualityFn,
  StoreActions,
  AsyncActions,
} from './types';
import { ActionTypes } from './types';
/**
 * Creates a store for keeping track and manipulating a state
 * that's pass to it.
 *
 * @param options.name The name for the store.
 * @param options.initialState Value of the initial state.
 * @param options.actions Optional, actions for interacting with the state.
 * The first param of an action function is the state and it accepts
 * any number of additional params for passing in additional data.
 *
 * Actions must return a new state instead of mutating the existing
 * state.
 * @param options.asyncActions Optional, async actions. Unlike synchronous
 * actions where the new state is returned async actions has a callback function
 * as the first param which accepts the new state as the argument updates the store.
 * The second param is now the state.
 *
 * @returns \{useStore, actions, asyncActions, store}
 *
 *
 * @example
 * const {useStore, actions, asyncActions} = createStore(
 *  {
 *    name: 'counter', initialState: { count: 0 },
 *    actions: {
 *      increment: (state) => ({count: state.count + 1}),
 *      add: (state, amount: number) => ({count: state.count + amount})
 *    },
 *    asyncActions: {
 *      delayedAddToCount: async (setState, state, value: number) => {
 *        const newState = {count: state.count + value};
 *        await do some async work...
 *        setState(newState);
 *      }
 *    }
 *  }
 * );
 *
 * // To access the count inside of a component:
 *
 * const count = useStore(state => state.counter.count);
 *
 * // Add 3 to the count.
 * actions.add(3);
 *
 */
export const createStore = <
  Name extends string,
  State,
  ActionOption extends Actions<State>,
  AsyncActionOptions extends AsyncActions<State>,
  SelectFn extends (state: Store<Name, State>) => ReturnType<SelectFn>,
>(
  options: StoreOptions<State, Name, ActionOption, AsyncActionOptions>,
): {
  useStore: <StoreSelect extends SelectFn>(
    select: StoreSelect,
    equalFn?: EqualityFn<Store<Name, State>>,
  ) => ReturnType<StoreSelect>;
  actions: StoreActions<ActionOption, ActionTypes.sync>;
  asyncActions: StoreActions<AsyncActionOptions, ActionTypes.async>;
  store: Store<Name, State>;
} => {
  //
  const store = { [options.name]: options.initialState } as Store<Name, State>;
  const stateListeners: StateListeners<Store<Name, State>> = new Map();

  const actions = createActions(
    options.actions || ({} as ActionOption),
    store,
    options.name,
    stateListeners,
  );
  const asyncActions = createActions(
    options.asyncActions || ({} as AsyncActionOptions),
    store,
    options.name,
    stateListeners,
    2,
  );
  const useStore = createUseStoreHook(store, stateListeners);

  return { useStore, actions, asyncActions, store };
};

/**
 * Creates a custom hook that can be used inside react components to
 * retrieve the store state.
 *
 * @param store The store the hooks is accessing.
 * @param stateListeners Listeners associated with the store.
 */
export const createUseStoreHook = <StoreState extends Store>(
  store: StoreState,
  stateListeners: StateListeners<StoreState>,
): (<SelectFn extends (state: StoreState) => ReturnType<SelectFn>>(
  select: SelectFn,
  equalFn?: EqualityFn<StoreState>,
) => ReturnType<SelectFn>) => {
  /**
   * A Hook use for accessing the state of the store.
   *
   * @param select Function that takes the store state as the argument
   * and can be use to narrow down the value returned.
   *
   * @param equalFn Function that is called when the store updates. Use
   * to decide if the local state should be updated as well. The new state
   * and the old state are available as the first and second param.
   */
  const useStoreSelect = <T extends (state: StoreState) => ReturnType<T>>(
    select: T,
    equalFn?: EqualityFn<StoreState>,
  ): ReturnType<T> => {
    const [storeState, setStoreState] = useState<StoreState>(
      JSON.parse(JSON.stringify(store)),
    );

    // Add the setState function and the equalFn to the store to trigger
    // updates and rerender the component.
    if (!stateListeners.has(setStoreState)) {
      stateListeners.set(setStoreState, {
        setState: setStoreState,
        // If not update check callback is provided, compare current state
        // with new state by default to decide if rerender or not.
        equalFn:
          equalFn ||
          ((newState, oldState) => select(oldState) !== select(newState)),
      });
    }
    return select(storeState);
  };

  return useStoreSelect;
};

/**
 * Creates actions for interacting with a store.
 *
 * @param actions The actions defined when creating the store.
 * @param store The store associated with the actions.
 * @param stateName the name of the state, defined when creating
 * the store.
 * @param stateListeners Listeners listening for updates on
 * the store.
 * @param actionType The type of actions, sync or async.
 * @returns Object containing the actions.
 */
export const createActions = <
  UserDefinedActions extends Actions,
  Name extends string,
>(
  actions: UserDefinedActions,
  store: Store,
  stateName: Name,
  stateListeners: StateListeners<Store>,
  actionType: ActionTypes = ActionTypes.sync,
): StoreActions<UserDefinedActions, typeof actionType> => {
  const result = {} as StoreActions<UserDefinedActions, typeof actionType>;

  const updateStoreWrapper = (newState: Store[Name]) => {
    updateStateHelper(newState, store, stateName, stateListeners);
  };

  /**
   * Take each of the actions defined in during store creation and
   * use a wrapper to hide the store state, this way only the params
   * defined by the user will be available on the actions after the
   * store has been created.
   */
  for (const key in actions) {
    /**
     * @param payload user defined params from storeOptions in `createStore`.
     */
    result[key] = (...payload: unknown[]) => {
      if (actionType === ActionTypes.async) {
        actions[key](updateStoreWrapper, store[stateName], ...payload);
      } else {
        const newStateValue = actions[key](store[stateName], ...payload);
        updateStoreWrapper(newStateValue);
      }
    };
  }
  return result;
};

/**
 *
 * @param newState New state of the store
 * @param store Store to be updated
 * @param stateName Name of the state.
 * @param stateListeners
 */
const updateStateHelper = <Name extends string>(
  newState: Store[Name],
  store: Store,
  stateName: Name,
  stateListeners: StateListeners<Store>,
) => {
  const newStore = {
    [stateName]: newState,
  } as Store;

  // Checks to see if the new store state meets
  // the update conditions set by the component before
  // updating the component.
  stateListeners.forEach((listener) => {
    if (listener.equalFn) {
      if (listener.equalFn(newStore, store)) {
        listener.setState(newStore);
      }
    } else {
      listener.setState(newStore);
    }
  });
  store[stateName] = newState;
};
