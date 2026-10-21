import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'JobScout — Your personal job shortlist',description:'Fresh opportunities, saved jobs, and a daily digest tailored to your preferences.',robots:{index:false,follow:false},openGraph:{title:'JobScout',description:'Your next chapter starts here.'},icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}<footer style={{borderTop:"1px solid #e2e8f0",padding:"20px 24px",textAlign:"center",fontSize:"12px",color:"#64748b",background:"#fff"}}>© 2026 JobScout. Developed by <strong>SEO Girl - Ami</strong>. All rights reserved.</footer></body></html>}
