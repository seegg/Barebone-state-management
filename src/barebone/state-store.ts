/* eslint-disable @typescript-eslint/no-explicit-any */
import { StateListeners, Store } from './types';

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
   * Subscribe to state changes and return the unsubscribe function.
   */
  subscribe(
    setState: (store: Store<Name, State>) => void,
    equalFn: (
      oldStore: Store<Name, State>,
      newStore: Store<Name, State>,
    ) => boolean,
  ) {
    if (this.stateListeners.has(setState)) {
      return;
    }
    this.stateListeners.set(setState, { setState, equalFn });

    return () => {
      this.unsubscribe(setState);
    };
  }

  unsubscribe(setState: (store: Store<Name, State>) => void) {
    this.stateListeners.delete(setState);
  }

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
