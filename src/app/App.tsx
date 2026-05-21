import { RouterProvider } from 'react-router';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CourseProvider } from './context/CourseContext';
import { router } from './routes';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CourseProvider>
          <RouterProvider router={router} />
        </CourseProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
