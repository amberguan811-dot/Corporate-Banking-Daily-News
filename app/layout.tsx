import './globals.css';
import Link from 'next/link';
export const metadata = { title: 'APAC Deal Intelligence', description: 'Corporate banking transactions and deal intelligence across Asia-Pacific' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><header className="header"><div className="shell nav"><Link href="/" className="brand"><span className="brandIcon">◆</span> APAC<span className="brandThin"> / DEAL INTELLIGENCE</span></Link><div className="navLinks"><Link href="/">Overview</Link><a href="/#database">Deal Database</a><span className="live"><i/> APAC MARKET WATCH</span></div></div></header>{children}<footer className="footer shell"><span>© {new Date().getFullYear()} APAC Deal Intelligence</span><span>Research only · Verify all terms against primary sources · Not investment advice</span></footer></body></html>;
}
