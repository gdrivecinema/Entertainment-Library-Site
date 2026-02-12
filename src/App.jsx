import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  increment, 
  onSnapshot, 
  query, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Play, 
  Search, 
  Menu, 
  X, 
  LogIn, 
  LogOut, 
  LayoutDashboard, 
  PlusCircle, 
  Trash2, 
  Edit, 
  Eye, 
  Download,
  MonitorPlay,
  BarChart3,
  CheckSquare,
  Square,
  Send,
  Film
} from 'lucide-react';

// --- ফায়ারবেস সেটআপ ---
const firebaseConfig = {
  apiKey: "AIzaSyC1FAVo3EYbYQ1WRwiO59_tFea3R2UAVfg",
  authDomain: "ntertainment-library.firebaseapp.com",
  projectId: "ntertainment-library",
  storageBucket: "ntertainment-library.firebasestorage.app",
  messagingSenderId: "478814577603",
  appId: "1:478814577603:web:5ca317a27e65ae8282d376",
  measurementId: "G-JT2T8D4EFW"
};


// --- কনস্ট্যান্টস ---
const GENRES = [
  'Bangla', 'Hindi', 'English', 'Animation', 'South Indian',
  'Action', 'Horror', 'Romance', 'Comedy', 
  'Thriller', 'Sci-Fi', 'Drama', 'Adventure', 'Mystery',
  'Crime', 'Fantasy', 'Family', 'War'
];

export default function App() {
  // --- স্টেট ম্যানেজমেন্ট ---
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // ফর্ম স্টেট
  const [formData, setFormData] = useState({
    title: '',
    genres: [],
    posterUrl: '',
    downloadLink: '',
    description: '',
    views: 0,
    downloads: 0,
    dailyViews: {}
  });
  const [editingId, setEditingId] = useState(null);

  // --- SEO & Title Management (New Feature) ---
  useEffect(() => {
    if (currentPage === 'home') {
      document.title = "Entertainment Library - Download Latest HD Movies";
    } else if (currentPage === 'details' && selectedMovie) {
      document.title = `${selectedMovie.title} Download | Entertainment Library`;
    } else if (currentPage === 'dashboard') {
      document.title = "Admin Dashboard - Entertainment Library";
    } else {
      document.title = "Entertainment Library";
    }
  }, [currentPage, selectedMovie]);

  // --- অথেনটিকেশন ---
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, setUser);
    return () => unsubscribeAuth();
  }, []);

  // --- মুভি লোড করা ---
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'movies'));
    const unsubscribeMovies = onSnapshot(q, (snapshot) => {
      const moviesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      moviesData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setMovies(moviesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching movies:", error);
      setLoading(false);
    });
    return () => unsubscribeMovies();
  }, [user]);

  // --- ফাংশনালিটি ---

  const handleLogin = async (e) => {
    e.preventDefault();
    alert("অ্যাডমিন প্যানেলে স্বাগতম!");
    setCurrentPage('dashboard');
  };

  const handleLogout = async () => {
    setCurrentPage('home');
    alert("লগ আউট করা হয়েছে!");
  };

  const toggleGenre = (genre) => {
    setFormData(prev => {
      const currentGenres = prev.genres || [];
      if (currentGenres.includes(genre)) {
        return { ...prev, genres: currentGenres.filter(g => g !== genre) };
      } else {
        return { ...prev, genres: [...currentGenres, genre] };
      }
    });
  };

  const handleSubmitMovie = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.posterUrl || formData.genres.length === 0) {
      alert("দয়া করে টাইটেল, পোস্টার এবং অন্তত একটি ক্যাটাগরি সিলেক্ট করুন।");
      return;
    }
    if (!user) return;

    try {
      const movieData = { ...formData, updatedAt: serverTimestamp() };

      if (editingId) {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'movies', editingId);
        await updateDoc(docRef, movieData);
        alert("মুভি আপডেট হয়েছে!");
      } else {
        movieData.createdAt = serverTimestamp();
        movieData.views = 0;
        movieData.downloads = 0;
        movieData.dailyViews = {};
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'movies'), movieData);
        alert("নতুন মুভি যুক্ত হয়েছে!");
      }
      
      setFormData({ title: '', genres: [], posterUrl: '', downloadLink: '', description: '', views: 0, downloads: 0, dailyViews: {} });
      setEditingId(null);
      setCurrentPage('dashboard');
    } catch (error) {
      console.error("Error saving movie:", error);
      alert("সমস্যা হয়েছে, আবার চেষ্টা করুন।");
    }
  };

  const handleDelete = async (id) => {
    if (!user) return;
    if (confirm("আপনি কি নিশ্চিত এই মুভিটি ডিলিট করতে চান?")) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'movies', id));
    }
  };

  const handleEdit = (movie) => {
    const formattedGenres = Array.isArray(movie.genres) ? movie.genres : (movie.category ? [movie.category] : []);
    setFormData({ ...movie, genres: formattedGenres });
    setEditingId(movie.id);
    setCurrentPage('addMovie');
  };

  const openMovieDetails = async (movie) => {
    setSelectedMovie(movie);
    setCurrentPage('details');
    // Scroll to top
    window.scrollTo(0, 0);

    if (!user) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'movies', movie.id);
      const today = new Date().toISOString().split('T')[0];
      await updateDoc(docRef, {
        views: increment(1),
        [`dailyViews.${today}`]: increment(1)
      });
    } catch (err) { console.log("View update skipped"); }
  };

  const handleDownloadClick = async (movie) => {
    window.open(movie.downloadLink, '_blank');
    if (!user) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'movies', movie.id);
      await updateDoc(docRef, {
        downloads: increment(1)
      });
    } catch (err) {
      console.log("Download tracking failed");
    }
  };

  const filteredMovies = movies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase());
    const movieGenres = Array.isArray(movie.genres) ? movie.genres : [movie.category];
    const matchesCategory = categoryFilter === 'All' || movieGenres.includes(categoryFilter);
    return matchesSearch && matchesCategory;
  });

  const getAnalytics = () => {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.slice(0, 7);
    
    let totalViews = 0;
    let totalDownloads = 0;
    let todayViews = 0;
    let monthViews = 0;

    movies.forEach(movie => {
      totalViews += (movie.views || 0);
      totalDownloads += (movie.downloads || 0);
      
      const dailyStats = movie.dailyViews || {};
      Object.keys(dailyStats).forEach(date => {
        const views = dailyStats[date] || 0;
        if (date === today) todayViews += views;
        if (date.startsWith(currentMonth)) monthViews += views;
      });
    });

    return { totalViews, totalDownloads, todayViews, monthViews };
  };

  const stats = getAnalytics();
  const totalPosts = movies.length;

  // --- UI Components ---
  const Navbar = () => (
    <nav className="bg-gray-900 text-white shadow-lg sticky top-0 z-50 border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div onClick={() => setCurrentPage('home')} className="flex items-center space-x-2 cursor-pointer">
            <Film className="h-8 w-8 text-red-600 fill-current" />
            <span className="text-lg md:text-xl font-bold tracking-wider">ENTERTAINMENT <span className="text-red-600">LIBRARY</span></span>
          </div>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-gray-300">
            {isMenuOpen ? <X /> : <Menu />}
          </button>
          <div className="hidden md:flex items-center space-x-6">
            <button onClick={() => setCurrentPage('home')} className={`hover:text-red-500 ${currentPage === 'home' ? 'text-red-500' : ''}`}>Home</button>
            {currentPage === 'dashboard' || currentPage === 'addMovie' ? (
              <button onClick={() => setCurrentPage('home')} className="bg-gray-800 px-4 py-1 rounded text-sm hover:bg-gray-700">View Site</button>
            ) : (
              <button onClick={() => setCurrentPage('login')} className="flex items-center space-x-1 text-gray-400 hover:text-white">
                <LogIn size={18} /> <span>Admin</span>
              </button>
            )}
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-800 px-4 pt-2 pb-4 space-y-2">
          <button onClick={() => { setCurrentPage('home'); setIsMenuOpen(false); }} className="block w-full text-left py-2 text-white">Home</button>
          <button onClick={() => { setCurrentPage('login'); setIsMenuOpen(false); }} className="block w-full text-left py-2 text-red-400 font-bold">Admin Login</button>
        </div>
      )}
    </nav>
  );

  const HomeView = () => (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="bg-gradient-to-b from-gray-900 to-black p-6 md:p-10 text-center border-b border-gray-800">
        <h1 className="text-3xl md:text-5xl font-bold mb-4">Latest <span className="text-red-600">HD Movies</span></h1>
        <p className="text-gray-400 text-sm mb-6">Welcome to Entertainment Library - Your favorite destination for movies.</p>
        <div className="mt-4 max-w-lg mx-auto relative">
          <input 
            type="text" 
            placeholder="Search movies..." 
            className="w-full bg-gray-800 text-white py-3 px-10 rounded-full focus:outline-none focus:ring-2 focus:ring-red-600 border border-gray-700"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-3.5 text-gray-400 h-5 w-5" />
        </div>
      </div>

      <div className="bg-black sticky top-16 z-40 border-b border-gray-800 shadow-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap justify-center gap-2">
            <button 
              onClick={() => setCategoryFilter('All')}
              className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-colors border ${
                categoryFilter === 'All' ? 'bg-red-600 border-red-600 text-white' : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-500'
              }`}
            >
              All
            </button>
            {GENRES.map(cat => (
              <button 
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-colors border ${
                  categoryFilter === cat ? 'bg-red-600 border-red-600 text-white' : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-500'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-6">
        {loading ? (
          <div className="text-center text-gray-500 mt-10">লোড হচ্ছে...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
            {filteredMovies.map(movie => {
               const displayGenres = Array.isArray(movie.genres) ? movie.genres : (movie.category ? [movie.category] : []);
               return (
                <div 
                  key={movie.id} 
                  onClick={() => openMovieDetails(movie)}
                  className="bg-gray-900 rounded-lg overflow-hidden hover:scale-105 transition-transform cursor-pointer border border-gray-800 group"
                >
                  <div className="relative aspect-[2/3] overflow-hidden">
                    <img 
                      src={movie.posterUrl} 
                      alt={movie.title} 
                      className="w-full h-full object-cover"
                      onError={(e) => {e.target.src = 'https://via.placeholder.com/300x450?text=Error'}}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                      <Play className="text-white opacity-0 group-hover:opacity-100 w-12 h-12 fill-red-600" />
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-white font-semibold text-sm md:text-base truncate">{movie.title}</h3>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {displayGenres.slice(0, 2).map((g, i) => (
                        <span key={i} className="text-[10px] bg-gray-800 px-1.5 py-0.5 rounded text-gray-400 border border-gray-700">{g}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const MovieDetailsView = () => {
    if (!selectedMovie) return null;
    const displayGenres = Array.isArray(selectedMovie.genres) ? selectedMovie.genres : [selectedMovie.category];

    return (
      <div className="min-h-screen bg-black text-white pb-10">
        <div className="container mx-auto px-4 py-6">
          <button onClick={() => setCurrentPage('home')} className="text-gray-400 hover:text-white mb-4 flex items-center">← Back to Home</button>
          
          <div className="grid md:grid-cols-3 gap-8 bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="md:col-span-1">
              <img src={selectedMovie.posterUrl} alt={selectedMovie.title} className="w-full rounded-lg shadow-2xl border-4 border-gray-800"/>
            </div>
            
            <div className="md:col-span-2 space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{selectedMovie.title}</h1>
                <div className="flex flex-wrap gap-2 mb-4">
                  {displayGenres.map((g, i) => (
                    <span key={i} className="bg-red-600/20 text-red-500 px-3 py-1 rounded-full text-sm font-medium border border-red-600/30">
                      {g}
                    </span>
                  ))}
                </div>
                <div className="flex items-center space-x-6 text-sm text-gray-400">
                  <span className="flex items-center"><Eye size={16} className="mr-1"/> {selectedMovie.views} Views</span>
                  <span className="flex items-center text-green-500"><Download size={16} className="mr-1"/> {selectedMovie.downloads || 0} Downloads</span>
                </div>
              </div>

              <div className="bg-black/30 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-gray-300">কাহিনী সংক্ষেপ:</h3>
                <p className="text-gray-400 leading-relaxed text-sm md:text-base">{selectedMovie.description}</p>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-800">
                <div className="bg-blue-900/20 border border-blue-700/50 p-3 rounded text-blue-400 text-xs md:text-sm flex items-center justify-center space-x-2">
                   <Send size={16} />
                   <span>মুভিটি আমাদের টেলিগ্রাম বটের মাধ্যমে পাঠানো হবে।</span>
                </div>

                <button 
                  onClick={() => handleDownloadClick(selectedMovie)}
                  className="flex items-center justify-center space-x-2 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg animate-pulse"
                >
                  <Send size={24} /> <span>Get via Telegram Bot</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const LoginView = () => (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white text-center mb-6">Admin Panel</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email" className="w-full bg-black border border-gray-700 text-white p-3 rounded" required />
          <input type="password" placeholder="Password" className="w-full bg-black border border-gray-700 text-white p-3 rounded" required />
          <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded font-bold">Login</button>
        </form>
        <button onClick={() => setCurrentPage('home')} className="mt-4 w-full text-center text-gray-500 text-sm">Back to Website</button>
      </div>
    </div>
  );

  const DashboardView = () => (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row">
      <div className="w-full md:w-64 bg-gray-900 border-r border-gray-800 p-6 flex flex-col space-y-2">
        <h2 className="text-xl font-bold text-white mb-6">Admin<span className="text-red-600">Panel</span></h2>
        <button onClick={() => setCurrentPage('dashboard')} className={`flex items-center space-x-3 p-3 rounded ${currentPage === 'dashboard' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
          <LayoutDashboard size={20} /> <span>Dashboard</span>
        </button>
        <button onClick={() => { setEditingId(null); setFormData({ title: '', genres: [], posterUrl: '', downloadLink: '', description: '', views: 0, downloads: 0, dailyViews: {} }); setCurrentPage('addMovie'); }} className={`flex items-center space-x-3 p-3 rounded ${currentPage === 'addMovie' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
          <PlusCircle size={20} /> <span>Add New Movie</span>
        </button>
        <div className="flex-grow"></div>
        <button onClick={handleLogout} className="flex items-center space-x-3 p-3 rounded text-gray-400 hover:bg-red-900 mt-auto"><LogOut size={20} /> <span>Logout</span></button>
      </div>

      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center"><BarChart3 className="mr-2 text-red-500"/> Performance Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900 p-5 rounded-lg border border-gray-800">
              <h3 className="text-gray-400 text-xs uppercase font-bold text-green-400">Total Downloads</h3>
              <p className="text-3xl font-bold text-green-500 mt-1">{stats.totalDownloads}</p>
              <p className="text-xs text-gray-500 mt-1">Telegram Clicks</p>
            </div>
            <div className="bg-gray-900 p-5 rounded-lg border border-gray-800">
              <h3 className="text-gray-400 text-xs uppercase font-bold text-blue-400">This Month Views</h3>
              <p className="text-3xl font-bold text-blue-500 mt-1">{stats.monthViews}</p>
            </div>
            <div className="bg-gray-900 p-5 rounded-lg border border-gray-800">
              <h3 className="text-gray-400 text-xs uppercase font-bold">Today's Views</h3>
              <p className="text-3xl font-bold text-white mt-1">{stats.todayViews}</p>
            </div>
            <div className="bg-gray-900 p-5 rounded-lg border border-gray-800">
              <h3 className="text-gray-400 text-xs uppercase font-bold text-purple-400">Total Movies</h3>
              <p className="text-3xl font-bold text-purple-500 mt-1">{totalPosts}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-800 flex justify-between items-center">
            <h3 className="font-bold">Movie List & Stats</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-black text-xs uppercase font-medium">
                <tr>
                  <th className="px-4 py-3">Movie Info</th>
                  <th className="px-4 py-3 text-center">Page Views</th>
                  <th className="px-4 py-3 text-center text-green-500">Downloads</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {movies.map(movie => {
                   return (
                    <tr key={movie.id} className="hover:bg-black/50 transition-colors">
                      <td className="px-4 py-3 flex items-center space-x-3">
                        <img src={movie.posterUrl} className="w-8 h-12 object-cover rounded bg-gray-800" />
                        <span className="text-white font-medium max-w-[150px] truncate">{movie.title}</span>
                      </td>
                      <td className="px-4 py-3 text-center">{movie.views}</td>
                      <td className="px-4 py-3 text-center text-green-400 font-bold">{movie.downloads || 0}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end space-x-2">
                          <button onClick={() => handleEdit(movie)} className="p-1 hover:text-blue-400"><Edit size={16} /></button>
                          <button onClick={() => handleDelete(movie.id)} className="p-1 hover:text-red-500"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const AddMovieView = () => (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row">
      <div className="hidden md:flex w-64 bg-gray-900 border-r border-gray-800 p-6 flex-col space-y-2">
         <h2 className="text-xl font-bold text-white mb-6">Admin<span className="text-red-600">Panel</span></h2>
         <button onClick={() => setCurrentPage('dashboard')} className="flex items-center space-x-3 p-3 rounded text-gray-400 hover:bg-gray-800">
          <LayoutDashboard size={20} /> <span>Back to Dashboard</span>
        </button>
      </div>

      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-3xl mx-auto bg-gray-900 p-6 rounded-lg border border-gray-800">
          <h2 className="text-2xl font-bold mb-6">{editingId ? 'Edit Movie' : 'Add New Movie'}</h2>
          
          <form onSubmit={handleSubmitMovie} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Movie Title</label>
                  <input 
                    type="text" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-black border border-gray-700 p-2 rounded focus:border-red-600 focus:outline-none" 
                    placeholder="e.g. Toofan (2025)"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Poster Image URL</label>
                  <input 
                    type="text" 
                    value={formData.posterUrl}
                    onChange={e => setFormData({...formData, posterUrl: e.target.value})}
                    className="w-full bg-black border border-gray-700 p-2 rounded focus:border-red-600 focus:outline-none" 
                    placeholder="https://i.ibb.co/..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1 text-green-400 font-bold">Telegram Bot Link</label>
                  <div className="flex items-center bg-black border border-gray-700 rounded p-2">
                     <Send size={16} className="text-gray-500 mr-2" />
                     <input 
                      type="text" 
                      value={formData.downloadLink}
                      onChange={e => setFormData({...formData, downloadLink: e.target.value})}
                      className="w-full bg-transparent focus:outline-none text-white" 
                      placeholder="https://t.me/YourBot?start=..."
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Paste the specific start link from your bot</p>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Select Genres (Multiple)</label>
                <div className="grid grid-cols-2 gap-2 bg-black p-3 rounded border border-gray-700 max-h-[250px] overflow-y-auto custom-scrollbar">
                  {GENRES.map(genre => (
                    <div 
                      key={genre}
                      onClick={() => toggleGenre(genre)}
                      className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors ${
                        formData.genres.includes(genre) ? 'bg-red-900/30 border border-red-800 text-white' : 'hover:bg-gray-800 text-gray-400'
                      }`}
                    >
                      {formData.genres.includes(genre) ? 
                        <CheckSquare size={18} className="text-red-500" /> : 
                        <Square size={18} />
                      }
                      <span className="text-sm">{genre}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1">Description</label>
              <textarea 
                rows="4"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full bg-black border border-gray-700 p-2 rounded focus:border-red-600 focus:outline-none" 
                placeholder="Write something about the movie..."
              ></textarea>
            </div>

            <div className="flex space-x-3 pt-4 border-t border-gray-800">
              <button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded font-bold">
                {editingId ? 'Update Movie' : 'Publish Movie'}
              </button>
              <button type="button" onClick={() => setCurrentPage('dashboard')} className="px-6 bg-gray-800 hover:bg-gray-700 rounded font-bold">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="font-sans antialiased text-gray-100 bg-black min-h-screen">
      {currentPage !== 'login' && currentPage !== 'dashboard' && currentPage !== 'addMovie' && <Navbar />}
      {currentPage === 'home' && <HomeView />}
      {currentPage === 'details' && <MovieDetailsView />}
      {currentPage === 'login' && <LoginView />}
      {currentPage === 'dashboard' && <DashboardView />}
      {currentPage === 'addMovie' && <AddMovieView />}
      
      {(currentPage === 'home' || currentPage === 'details') && (
        <footer className="bg-gray-900 border-t border-gray-800 text-center p-8 mt-auto">
          <p className="text-gray-500 mb-2">&copy; 2026 Entertainment Library. All rights reserved.</p>
          <div className="flex justify-center space-x-4 text-sm text-gray-600">
            <a href="#" className="hover:text-white">DMCA</a>
            <a href="#" className="hover:text-white">Privacy Policy</a>
          </div>
        </footer>
      )}
    </div>
  );
}