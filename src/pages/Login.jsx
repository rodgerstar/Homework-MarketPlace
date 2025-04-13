import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const queryParams = new URLSearchParams(location.search);
  const preSelectedRole = queryParams.get('role') || 'client';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const url = isLogin ? 'http://localhost:5000/api/login' : 'http://localhost:5000/api/signup';
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : { ...formData, role: 'client' };
      const response = await axios.post(url, payload);
      const { token, role } = response.data;

      login(token, role);

      // Redirect all users to the homepage after login
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('/src/assets/bgLogin.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="w-full max-w-4xl flex md:flex-row flex-col rounded-xl shadow-2xl overflow-hidden">
        {/* Left Section: Mirrored Background with Welcome Text */}
        <div
          className="w-full md:w-1/2 p-8 flex items-center justify-center text-center"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('/src/assets/bgLogin.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">Welcome!</h2>
            <p className="text-lg md:text-xl text-gray-200 drop-shadow-md">
              Professor Ann is your go-to for homework help.
            </p>
          </div>
        </div>

        {/* Right Section: Login/Signup Form */}
        <div className="w-full md:w-1/2 bg-gray-800 bg-opacity-80 p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-3 text-center px-0 text-white">
            {isLogin ? 'Login' : 'Sign Up'}
          </h1>
          {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
          <div className="border-2 border-gray-500 p-5 rounded-md shadow-lg w-full max-w-sm md:max-w-md mx-auto">
            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="mb-4">
                  <label className="block mb-1 text-sm md:text-base text-white">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-2 rounded bg-gray-700 text-white text-sm md:text-base"
                    required={!isLogin}
                  />
                </div>
              )}
              <div className="mb-4">
                <label className="block mb-1 text-sm md:text-base text-white">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-gray-700 text-white text-sm md:text-base"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 text-sm md:text-base text-white">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-gray-700 text-white text-sm md:text-base"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-lime-green text-white py-2 rounded-lg hover:bg-green-500 text-sm md:text-base"
              >
                {isLogin ? 'Login' : 'Sign Up'}
              </button>
            </form>
            <p className="mt-4 text-center text-sm md:text-base text-gray-300">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-lime-green hover:underline"
              >
                {isLogin ? 'Sign Up' : 'Login'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;