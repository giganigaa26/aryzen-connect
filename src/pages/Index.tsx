// Index is now handled by RootRedirect in App.tsx
import { Navigate } from "react-router-dom";
const Index = () => <Navigate to="/" replace />;
export default Index;
