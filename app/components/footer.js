import "./footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        
        {/* Brand Section */}
        <div className="footer-brand">
          <h2 className="footer-brand-title">CyberLearn AI</h2>
          <p className="footer-brand-desc">
            Mastering cybersecurity through hands-on labs and AI-driven insights. 
            Built for the next generation of security professionals.
          </p>
        </div>

        {/* Links Sections */}
        <div className="footer-links-container">
          <div className="footer-links-column">
            <h4 className="footer-column-title">Platform</h4>
            <a href="#" className="footer-link">Modules</a>
            <a href="#" className="footer-link">Labs</a>
            <a href="#" className="footer-link">AI Insights</a>
          </div>

          <div className="footer-links-column">
            <h4 className="footer-column-title">Resources</h4>
            <a href="#" className="footer-link">Documentation</a>
            <a href="#" className="footer-link">Community</a>
            <a href="#" className="footer-link">Support</a>
          </div>

          <div className="footer-links-column">
            <h4 className="footer-column-title">Company</h4>
            <a href="#" className="footer-link">About Us</a>
            <a href="#" className="footer-link">Privacy Policy</a>
            <a href="#" className="footer-link">Terms of Service</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-copyright">
          © 2026 CyberLearn AI. All rights reserved.
        </p>
        <div>
           <span className="footer-motto">Secure. Analyze. Learn.</span>
        </div>
      </div>
    </footer>
  );
}
