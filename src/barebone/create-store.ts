import { useEffect, useRef, useState } from 'react';
import type {
  Actions,
  StoreOptions,
  Store,
  EqualityFn,
  StoreActions,
  AsyncActions,
  CreateStoreResult,
  UseStoreHook,
  CreateActionsResult,
} from './types';
import { ActionTypes } from './types';
import { StateStore } from './state-store';

/**
 * Creates a store for keeping track and manipulating a state
 * that's pass to it.
 *
 * @param options.name The name associated with the store.
 * @param options.initialState Value of the initial state.
 * @param options.actions Optional, actions for interacting with the state.
 * The first param of an action function is the state and it accepts
 * any number of additional params for passing in additional data.
 *
 * Actions must return a new state instead of mutating the existing
 * state.
 *
 * @param options.asyncActions Optional, async actions. Unlike synchronous
 * actions the state is access through the result of a function call. Other
 * than that both types of actions works the same way.
 *
 * @returns { useStore, actions, asyncActions, store }
 *
 *
 * @example
 * const { useStore, actions, asyncActions, store } = createStore(
 *  {
 *    name: 'counter', initialState: { count: 0 },
 *    actions: {
 *      increment: (state) => ({count: state.count + 1}),
 *      add: (state, amount: number) => ({count: state.count + amount})
 *    },
 *    asyncActions: {
 *      delayedAddToCount: async (getState, value: number) => {
 *        const newState = {count: getState().count + value};
 *        await do some async work...
 *        return newState;
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
): CreateStoreResult<
  State,
  Name,
  SelectFn,
  ActionOption,
  AsyncActionOptions
> => {
  //
  const stateStore = new StateStore(options.name, options.initialState);

  const storeActions = createActions(
    stateStore,
    options.actions,
    options.asyncActions,
  );

  const useStore = createUseStoreHook(stateStore);

  return { useStore, store: stateStore.store, ...storeActions };
};

/**
 * Creates a custom hook that can be used inside react components to
 * retrieve the store state.
 *
 * @param stateStore The store the hooks is accessing.
 */
export const createUseStoreHook = <
  StoreInstance extends StateStore,
  SelectFn extends (state: StoreInstance['store']) => ReturnType<SelectFn>,
>(
  stateStore: StoreInstance,
): UseStoreHook<StoreInstance['store'], SelectFn> => {
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
  const useStoreSelect = <
    T extends (state: StoreInstance['store']) => ReturnType<T>,
  >(
    select: T,
    equalFn?: EqualityFn<StoreInstance['store']>,
  ): ReturnType<T> => {
    // Serialise a local copy so changes in the main store wont be reflected
    // locally when component rerenders unless an updated is requested.
    const [storeState, setStoreState] = useState<StoreInstance['store']>(
      JSON.parse(JSON.stringify(stateStore.getStore())),
    );

    const updateCheckFn = useRef<EqualityFn<StoreInstance['store']>>();
    updateCheckFn.current = equalFn;

    useEffect(() => {
      const unsubscribe = stateStore.subscribe(
        setStoreState,
        (newState, oldState) => {
          if (updateCheckFn.current) {
            return updateCheckFn.current(newState, oldState);
          }
          return defaultStoreUpdateCheck(select(oldState), select(newState));
        },
      );
      // Remove the listener from the store when component unmounts.
      return () => {
        unsubscribe && unsubscribe();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return select(storeState);
  };

  return useStoreSelect;
};

/**
 * Default logic for checking if local state should be updated
 * when the store updates.
 */
const defaultStoreUpdateCheck = <SelectFnResult>(
  oldStoreResult: SelectFnResult,
  newStoreResult: SelectFnResult,
): boolean => {
  // When the hook select function returns an array, only one
  // element needs to be different.
  if (Array.isArray(oldStoreResult) && Array.isArray(newStoreResult)) {
    let shouldUpdate = false;
    for (let i = 0; i < oldStoreResult.length; i++) {
      if (oldStoreResult[i] !== newStoreResult[i]) {
        shouldUpdate = true;
        break;
      }
    }
    return shouldUpdate;
  } else {
    return oldStoreResult !== newStoreResult;
  }
};

/**
 * @param stateStore Object keeping track of state and listeners.
 * @param actions Synchronous actions.
 * @param asyncActions Async actions.
 * @returns Object containing the sync and async actions for the store.
 */
export const createActions = <
  UserDefinedActions extends Actions,
  UserDefinedAsyncActions extends AsyncActions,
  StoreInstance extends StateStore,
>(
  stateStore: StoreInstance,
  actionsOption?: UserDefinedActions,
  asyncActionsOption?: UserDefinedAsyncActions,
): CreateActionsResult<UserDefinedActions, UserDefinedAsyncActions> => {
  //
  const actions = {} as StoreActions<UserDefinedActions, ActionTypes.sync>;
  const asyncActions = {} as StoreActions<
    UserDefinedAsyncActions,
    ActionTypes.async
  >;

  // Create the sync actions.
  for (const key in actionsOption) {
    actions[key] = (...payload: unknown[]) => {
      stateStore.updateState(
        actionsOption[key](stateStore.getState(), ...payload),
      );
    };
  }
  // Create the async actions.
  for (const key in asyncActionsOption) {
    asyncActions[key] = async (...payload: unknown[]) => {
      stateStore.updateState(
        await asyncActionsOption[key](
          stateStore.getState.bind(stateStore),
          ...payload,
        ),
      );
    };
  }

  return { actions, asyncActions };
};
