import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { StoreProvider } from './context/StoreContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import { About, Contact } from './pages/Info'
import Admin from './pages/Admin'

// Di GitHub Pages situs tinggal di /febriana/, jadi semua rute harus
// diawali /febriana/ — tanpa ini, refresh atau kembali ke Beranda akan
// mendarat di pakseh-app.github.io (404). Di laptop (npm run dev) tetap "/".
export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter basename={import.meta.env.DEV ? '/' : '/febriana'}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/katalog" element={<Catalog />} />
            <Route path="/produk/:id" element={<ProductDetail />} />
            <Route path="/keranjang" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/tentang" element={<About />} />
            <Route path="/kontak" element={<Contact />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  )
}
