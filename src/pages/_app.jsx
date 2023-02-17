import '../styles/globals.css';
import { usePanelbear } from '@panelbear/panelbear-nextjs';
import { Inter } from '@next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const PANELBEAR_SITE_ID = process.env.NEXT_PUBLIC_PANELBEAR_SITE_ID;

function MyApp({ Component, pageProps }) {
  usePanelbear(PANELBEAR_SITE_ID);
  return (
    <main className={`${inter.variable} font-sans`}>
      <Component {...pageProps} />
    </main>
  );
}

export default MyApp;
