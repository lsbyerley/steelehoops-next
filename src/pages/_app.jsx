import '../styles/globals.css';
import { usePanelbear } from '@panelbear/panelbear-nextjs';

const PANELBEAR_SITE_ID = process.env.NEXT_PUBLIC_PANELBEAR_SITE_ID;

function MyApp({ Component, pageProps }) {
  usePanelbear(PANELBEAR_SITE_ID);
  return <Component {...pageProps} />;
}

export default MyApp;
