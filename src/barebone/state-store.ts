/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  EqualityFn,
  StateListeners,
  Store,
  StoreChangeListener,
} from './types';

export class StateStore<Name extends string = string, State = any> {
  stateListeners: StateListeners<Store<Name, State>>;
  store: Store<Name, State>;
  stateName: Name;

  constructor(stateName: Name, state: State) {
    this.stateListeners = new Map();
    this.stateName = stateName;
    this.store = { [stateName]: state } as Store<Name, State>;
  }

  /**
   * Subscribe to store updates and return the unsubscribe function.
   */
  subscribe(
    storeChangeListener: StoreChangeListener<Store<Name, State>>,
    equalFn: EqualityFn<Store<Name, State>>,
  ) {
    if (this.stateListeners.has(storeChangeListener)) {
      return;
    }
    this.stateListeners.set(storeChangeListener, {
      setState: storeChangeListener,
      equalFn,
    });

    return () => {
      this.unsubscribe(storeChangeListener);
    };
  }

  unsubscribe(storeChangeListener: StoreChangeListener<Store<Name, State>>) {
    this.stateListeners.delete(storeChangeListener);
  }

  /**
   * Update the store, check each listener to see if each local state
   * should be updated as well.
   */
  updateState(newState: State) {
    const newStore = { [this.stateName]: newState } as Store;

    // Check to see if the new state meets the update requirements
    // set by the component before updating.
    this.stateListeners.forEach((listener) => {
      if (listener.equalFn) {
        if (listener.equalFn(newStore, this.store)) {
          listener.setState(JSON.parse(JSON.stringify(newStore)));
        }
      } else {
        listener.setState(newStore);
      }
    });
    this.store[this.stateName] = newState;
  }

  getStore() {
    return this.store;
  }

  getState() {
    return this.store[this.stateName];
  }
}
