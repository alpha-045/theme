import {Link, Outlet } from "react-router-dom"


export default function Layout(){


    return(<div>
           <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-3">
                  <Link to={'/'} className="text-[#1B2D4F] font-semibold text-lg tracking-tight">DEV201</Link>
                </div>
                {/* Auth Buttons */}
                <div className=" md:flex items-center gap-3">
                  <Link
                    to="/login"
                    className="text-gray-700 text-sm font-medium hover:text-[#1B2D4F] transition-colors px-3 py-2"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="bg-[#1b2d4f57] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-[#243d6a] transition-colors"
                  >
                    Sign up
                  </Link>
                </div>
              </nav>
              <main>
                <Outlet />
              </main>
    </div>)
}