import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'JobScout — Your personal job shortlist',description:'Fresh opportunities, saved jobs, and a daily digest tailored to your preferences.',robots:{index:false,follow:false},openGraph:{title:'JobScout',description:'Your next chapter starts here.'},icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}
