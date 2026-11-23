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

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
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
