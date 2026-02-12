// App.jsx (Public site + Secure Admin panel with Firebase)
import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
} from "firebase/firestore";
import { Helmet } from "react-helmet";

/* ================= FIREBASE CONFIG ================= */
const firebaseConfig = {
  apiKey: "AIzaSyC1FAVo3EYbYQ1WRwiO59_tFea3R2UAVfg",
  authDomain: "ntertainment-library.firebaseapp.com",
  projectId: "ntertainment-library",
  storageBucket: "ntertainment-library.firebasestorage.app",
  messagingSenderId: "478814577603",
  appId: "1:478814577603:web:5ca317a27e65ae8282d376",
  measurementId: "G-JT2T8D4EFW"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ================= MAIN APP ================= */
export default function App() {
  const [admin, setAdmin] = useState(null);
  const [movies, setMovies] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔐 Admin auth
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setAdmin(u);
    });
  }, []);

  // 🎬 Load movies (pagination)
  useEffect(() => {
    const q = query(collection(db, "movies"), orderBy("views", "desc"), limit(10));
    const unsub = onSnapshot(q, (snap) => {
      setMovies(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLastDoc(snap.docs[snap.docs.length - 1]);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const loadMore = () => {
    if (!lastDoc) return;
    const q = query(
      collection(db, "movies"),
      orderBy("views", "desc"),
      startAfter(lastDoc),
      limit(10)
    );
    onSnapshot(q, (snap) => {
      setMovies((prev) => [...prev, ...snap.docs.map((d) => ({ id: d.id, ...d.data() }))]);
      setLastDoc(snap.docs[snap.docs.length - 1]);
    });
  };

  const adminLogin = async (email, pass) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  return (
    <div className={dark ? "dark" : "light"}>
      <Helmet>
        <title>Movie Download Hub</title>
        <meta name="description" content="Trending & Popular Movies Download" />
      </Helmet>

      <header>
        <h1>🎥 Movie Hub</h1>
        <button onClick={() => setDark(!dark)}>🌙</button>
        {admin && <button onClick={() => signOut(auth)}>Logout</button>}
      </header>

      {/* 🔥 Banner Slider */}
      <section className="banner">Banner Slider</section>

      {/* ⭐ Popular */}
      <h2>Popular Movies</h2>
      {loading && <div className="skeleton">Loading...</div>}
      <div className="grid">
        {movies.map((m) => (
          <div key={m.id} className="card">
            <h3>{m.title}</h3>
            <a href={m.link} download>Download</a>
          </div>
        ))}
      </div>
      <button onClick={loadMore}>Load More</button>

      {/* 📈 Trending */}
      <section>
        <h2>Trending</h2>
      </section>

      {/* 🤖 Telegram */}
      <a href="https://t.me/yourbot" target="_blank">Open Telegram Bot</a>

      {/* 🔐 Admin Panel */}
      {!admin && (
        <div className="admin-login">
          <h3>Admin Login</h3>
          <button onClick={() => adminLogin("admin@email.com", "PASSWORD_FROM_FIREBASE")}>Login</button>
        </div>
      )}

      {admin && <div className="admin-panel">Admin Panel (Upload / Edit Movies)</div>}
    </div>
  );
}

/* ================= FIREBASE RULES =================
service cloud.firestore {
 match /databases/{database}/documents {
  match /movies/{doc} {
   allow read: if true;
   allow write: if request.auth != null;
  }
 }
}
=================================================== */
