import "@/styles/globals.css";
import "@/styles/home.scss";
import "@/styles/main.scss";
import "@/styles/nav.scss";
import "@/styles/posts.scss";

import Layout from '../components/layout'

export default function App({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  )
}