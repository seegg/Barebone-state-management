// import { renderHook } from '@testing-library/react';
import { createStore } from '../src/barebone';

describe('createStore()', () => {
  interface TestStore {
    value: number;
    isUpdating: boolean;
  }

  const { useStore, actions, store } = createStore<TestStore>({
    name: 'test',
    initialState: { value: 0, isUpdating: false },
    actions: {
      increment: (state) => ({ ...state, value: state.value + 1 }),
    },
  });

  describe('useStore()', () => {
    it('Should select properties from the store', () => {});
  });
});
