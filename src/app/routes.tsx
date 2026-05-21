import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { PredictionTool } from './pages/PredictionTool';
import { Insights } from './pages/Insights';
import { CourseHub } from './pages/CourseHub';
import { SignIn } from './pages/SignIn';
import { NotFound } from './pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Landing },
      { path: 'dashboard', Component: Dashboard },
      { path: 'courses', Component: CourseHub },
      { path: 'predict', Component: PredictionTool },
      { path: 'insights', Component: Insights },
      { path: 'signin', Component: SignIn },
      { path: '*', Component: NotFound },
    ],
  },
]);
