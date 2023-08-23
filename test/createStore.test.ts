/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { createStore } from '../src/barebone';

describe('createStore()', () => {
  interface TestCounter {
    value: number;
    isUpdating: boolean;
  }

  // Test the useStore hook.
  describe('useStore()', () => {
    const initialState: TestCounter = {
      value: 0,
      isUpdating: false,
    };
    const { useStore, actions, store } = createStore({
      name: 'test',
      initialState,
      actions: {
        increment: (state) => ({ ...state, value: state.value + 1 }),
        setCounterValue: (state, value: number) => ({ ...state, value }),
      },
    });

    it('Selects the correct properties from the store', () => {
      /** Value from the store. */
      const expected = store.test.value;

      const { result } = renderHook(() =>
        useStore((store) => store.test.value),
      );
      expect(result.current).toEqual(expected);
    });

    it('Receives updates from the store', () => {
      /** Value of store pre increment. */
      const oldValue = store.test.value;

      const hookResult = renderHook(() =>
        useStore((store) => store.test.value),
      );

      // Update the store by calling an action.
      act(() => actions.increment());
      const currentValue = store.test.value;

      expect(hookResult.result.current).not.toEqual(oldValue);
      expect(hookResult.result.current).toEqual(currentValue);
    });

    it('Should not update local state unless equality check passes', () => {
      /** Value of store pre increment. */
      const oldValue = store.test.value;

      const { result } = renderHook(() => {
        return useStore(
          (store) => store.test.value,
          // Don't receive updates unless the new value is a multiple of 5 or 0.
          (newStore) => newStore.test.value % 5 === 0,
        );
      });

      // Update the store a value that fails the check.
      act(() => actions.setCounterValue(3));

      expect(result.current).not.toEqual(store.test.value);
      expect(result.current).toEqual(oldValue);

      // Set a value to passes the check.
      act(() => actions.setCounterValue(15));
      expect(result.current).toEqual(store.test.value);
    });
  });
});
