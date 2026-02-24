import { Route, Switch } from 'wouter';
import { ConfigProvider } from './context/ConfigContext';
import { ErrorOverlay } from './components/ErrorOverlay';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { DocumentPage } from './pages/DocumentPage';

export default function App() {
  return (
    <ConfigProvider>
      <Switch>
        <Route path="/">
          <HomePage />
        </Route>
        <Route path="/:document">
          <DocumentPage />
        </Route>
      </Switch>
      <ErrorOverlay />
    </ConfigProvider>
  );
}
