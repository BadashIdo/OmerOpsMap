import Home from './pages/Home';
import Admin from './pages/Admin';
import Parks from './pages/Parks';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Admin": Admin,
    "Parks": Parks,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};