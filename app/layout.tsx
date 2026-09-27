import './globals.css';
import { FloatingTrekForm } from '../components/FloatingTrekForm';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { VisitorLeadPopup } from '../components/VisitorLeadPopup';

export const metadata = { title: 'The Himalayan Hikes — Find Your Trail in the Himalayas', description: 'Explore thoughtful trekking experiences rooted in the Garhwal Himalayas with The Himalayan Hikes.', icons: { icon: '/himalayan-hikes-logo.png', apple: '/himalayan-hikes-logo.png' }, openGraph: { title: 'The Himalayan Hikes', description: 'Find your trail in the Indian Himalayas.' } };

export default function RootLayout({children}:{children:React.ReactNode}) {
 return <html lang="en"><body><Header/><main>{children}</main><Footer/><FloatingTrekForm/><VisitorLeadPopup/></body></html>
}
