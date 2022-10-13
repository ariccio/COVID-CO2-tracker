// import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import {BrowserRouter} from 'react-router-dom';

import { store } from './app/store';
import {App} from './App';
import i18n from './test_support/i18nForTests';
// import i18n from './i18n';


test('basic home page', () => {
  const { getByText } = render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </I18nextProvider>
    </Provider>
  );

  expect(getByText(/Welcome to the COVID CO2 Tracker!/i)).toBeInTheDocument();
  // expect(getByText(/Fartipelago/i)).toBeInTheDocument();
});
