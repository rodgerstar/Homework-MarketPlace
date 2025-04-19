import Navbar from '../components/Navbar';
import heroBg from '../assets/bg.jpg';

function Home() {
  return (
    <div className="min-h-screen text-white">
      <div
        className="flex flex-col items-center justify-center h-[80vh] text-center px-4 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${heroBg})`,
        }}
      >
        <h1 className="text-5xl font-bold mb-4">Professor Anne EssayPro Writer</h1>
        <p className="text-xl mb-6">
          Get top-notch essays, quizzes, Pearson & McGraw Hill homework, and exams done by professionals
        </p>
        <a href="/login">
          <button className="bg-lime-green text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-500">
            View Services
          </button>
        </a>
      </div>
    </div>
  );
}

export default Home;