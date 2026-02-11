import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth(); // Ensure logout is available
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isHovering, setIsHovering] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);



    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (isHovering) return;
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % 3);
        }, 5000);
        return () => clearInterval(interval);
    }, [isHovering]);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % 3);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + 3) % 3);

    const slides = [
        {
            title: 'Student View',
            stats: [
                { label: 'Attendance', value: '92%', color: '#10B981' },
                { label: 'Subjects', value: '6', color: '#3B82F6' },
                { label: 'Alerts', value: '2', color: '#F59E0B' }
            ],
            bars: [92, 85, 78, 95, 88, 90]
        },
        {
            title: 'Faculty View',
            stats: [
                { label: 'Students', value: '50', color: '#8B5CF6' },
                { label: 'Teaching', value: '4', color: '#06B6D4' },
                { label: 'Today', value: '3', color: '#10B981' }
            ],
            bars: [90, 85, 95, 88, 92, 87]
        },
        {
            title: 'Admin View',
            stats: [
                { label: 'Students', value: '450', color: '#059669' },
                { label: 'Faculty', value: '28', color: '#8B5CF6' },
                { label: 'Subjects', value: '15', color: '#3B82F6' }
            ],
            bars: [88, 94, 86, 91, 89, 93]
        }
    ];

    const handlePortalClick = (portal) => {
        setIsMenuOpen(false); // Close menu if open
        if (user) logout(); // Logout if already logged in to switch or re-login
        navigate('/login', { state: { portal } });
    };

    return (
        <div className="landing-premium">
            {/* NAVBAR with Text Logo */}
            <nav className={`navbar-premium ${isScrolled ? 'scrolled' : ''}`}>
                <div className="nav-content">
                    {/* Logo Section (Left) */}
                    <div className="logo-text">
                        <svg className="logo-icon" width="32" height="32" viewBox="0 0 24 24" fill="none">
                            <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" fill="url(#logo-gradient)" />
                            <defs>
                                <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#0EA5E9" />
                                    <stop offset="100%" stopColor="#10B981" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="logo-text-content">
                            <span className="logo-main">SKUCET</span>
                            <span className="logo-sub">Attendance</span>
                        </div>
                    </div>

                    {/* Center Desktop Links (Student, Faculty, Admin) */}
                    <div className="nav-center-group desktop-only">
                        <button onClick={() => handlePortalClick('student')} className="nav-link">
                            Student Portal
                        </button>
                        <button onClick={() => handlePortalClick('faculty')} className="nav-link">
                            Faculty Portal
                        </button>
                        <button onClick={() => handlePortalClick('admin')} className="nav-btn-admin">
                            Admin Portal →
                        </button>
                    </div>

                    {/* Mobile Hamburger */}
                    <button className="hamburger-btn mobile-only" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {isMenuOpen ? (
                                <path d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile Menu Overlay */}
                {isMenuOpen && (
                    <div className="mobile-menu fade-in" onClick={() => setIsMenuOpen(false)}>
                        <div className="mobile-menu-card" onClick={e => e.stopPropagation()}>
                            <div className="portal-grid">
                                <button onClick={() => handlePortalClick('student')} className="portal-item orange">
                                    STUDENT
                                </button>
                                <button onClick={() => handlePortalClick('faculty')} className="portal-item dark">
                                    FACULTY
                                </button>
                                <button onClick={() => handlePortalClick('admin')} className="portal-item blue">
                                    ADMIN
                                </button>
                            </div>

                        </div>
                    </div>
                )}
            </nav>

            {/* HERO - Equal sized content and carousel */}
            <section className="hero-premium">
                <div className="hero-grid">
                    <div className="hero-left">
                        <div className="hero-label">
                            <span className="dot-pulse"></span>
                            CSE Department • Attendance Tracking
                        </div>

                        <h1 className="hero-title">
                            Effortless attendance
                            <span className="text-gradient"> tracking</span> for your campus
                        </h1>

                        <p className="hero-desc">
                            Simple, fast, and reliable attendance management.
                            Students track progress. Faculty marks instantly.
                            Admins get complete control.
                        </p>

                        <div className="hero-actions">
                            <button onClick={() => handlePortalClick('student')} className="btn-primary">
                                Get Started →
                            </button>
                            <button onClick={() => handlePortalClick('faculty')} className="btn-secondary">
                                View Dashboards
                            </button>
                        </div>
                    </div>

                    {/* COMPACT CAROUSEL */}
                    <div
                        className="carousel-compact"
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                    >
                        <button onClick={prevSlide} className="nav-arrow left">
                            ‹
                        </button>

                        <div className="carousel-box">
                            <div className="slides-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                                {slides.map((slide, index) => (
                                    <div key={index} className="slide">
                                        <div className="slide-header">
                                            <div className="dots-mac">
                                                <span className="dot red"></span>
                                                <span className="dot yellow"></span>
                                                <span className="dot green"></span>
                                            </div>
                                            <strong>{slide.title}</strong>
                                        </div>

                                        <div className="slide-body">
                                            <div className="stats-grid">
                                                {slide.stats.map((stat, i) => (
                                                    <div
                                                        key={i}
                                                        className="stat"
                                                        style={{
                                                            background: `${stat.color}15`,
                                                            borderLeft: `3px solid ${stat.color}`
                                                        }}
                                                    >
                                                        <div className="stat-val" style={{ color: stat.color }}>
                                                            {stat.value}
                                                        </div>
                                                        <div className="stat-lbl">{stat.label}</div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="chart">
                                                {slide.bars.map((height, i) => (
                                                    <div
                                                        key={i}
                                                        className="bar"
                                                        style={{
                                                            height: `${height}%`,
                                                            background: slide.stats[0].color,
                                                            animationDelay: `${i * 0.05}s`
                                                        }}
                                                    ></div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button onClick={nextSlide} className="nav-arrow right">
                            ›
                        </button>

                        <div className="indicators">
                            {[0, 1, 2].map((i) => (
                                <button
                                    key={i}
                                    className={`indicator ${currentSlide === i ? 'active' : ''}`}
                                    onClick={() => setCurrentSlide(i)}
                                    style={{
                                        background: currentSlide === i
                                            ? slides[i].stats[0].color
                                            : '#CBD5E1'
                                    }}
                                ></button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA SECTION - Moved to top (no logo above) */}
            <section className="cta-premium">
                <div className="cta-content">
                    <h2>Get started with SKUCET Attendance</h2>
                    <p>Access your portal to view or manage attendance records</p>

                    <div className="portal-buttons">
                        <button onClick={() => handlePortalClick('student')} className="portal-btn blue">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                            </svg>
                            Student Portal
                        </button>
                        <button onClick={() => handlePortalClick('faculty')} className="portal-btn purple">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                            </svg>
                            Faculty Portal
                        </button>
                        <button onClick={() => handlePortalClick('admin')} className="portal-btn green">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Admin Portal
                        </button>
                    </div>
                </div>
            </section>

            {/* TRUST SECTION - Moved to bottom */}
            <section className="trust-premium">
                <div className="trust-content">
                    <h2>Real-time sync that just works</h2>
                    <p>Faculty marks. Students see it instantly. Zero delays. Zero manual work.</p>

                    <div className="trust-grid">
                        <div className="trust-box">
                            <div className="trust-num">100%</div>
                            <div className="trust-title">Automated</div>
                            <div className="trust-text">Instant sync across all dashboards</div>
                        </div>
                        <div className="trust-box">
                            <div className="trust-num">&lt;1s</div>
                            <div className="trust-title">Update Time</div>
                            <div className="trust-text">Real-time attendance reflection</div>
                        </div>
                        <div className="trust-box">
                            <div className="trust-num">24/7</div>
                            <div className="trust-title">Available</div>
                            <div className="trust-text">Access anytime, anywhere</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ENHANCED FOOTER */}
            <footer className="footer-premium">
                <div className="footer-content">
                    <div className="footer-top">
                        <div className="footer-brand">
                            <div className="logo-text">
                                <svg className="logo-icon" width="40" height="40" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" fill="url(#footer-logo-gradient)" />
                                    <defs>
                                        <linearGradient id="footer-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#0EA5E9" />
                                            <stop offset="100%" stopColor="#10B981" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="logo-text-content">
                                    <span className="logo-main">SKUCET</span>
                                    <span className="logo-sub">Attendance</span>
                                </div>
                            </div>
                            <p className="footer-tagline">
                                Sri Krishna Devaraya University College of Engineering & Technology
                            </p>
                            <p className="footer-dept">CSE Department Attendance Management</p>
                        </div>

                        <div className="footer-cols">
                            <div className="footer-col">
                                <h4>Portals</h4>
                                <button onClick={() => handlePortalClick('student')}>Student Portal</button>
                                <button onClick={() => handlePortalClick('faculty')}>Faculty Portal</button>
                                <button onClick={() => handlePortalClick('admin')}>Admin Portal</button>
                            </div>
                            <div className="footer-col">
                                <h4>Features</h4>
                                <span>Real-time Updates</span>
                                <span>Attendance Tracking</span>
                                <span>Report Generation</span>
                                <span>Analytics Dashboard</span>
                            </div>
                            <div className="footer-col">
                                <h4>Contact</h4>
                                <span>CSE Department</span>
                                <span>SKUCET Campus</span>
                                <span>Anantapur, AP</span>
                                <span>contact@skucet.edu</span>
                            </div>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <p>© 2026 SKUCET. All rights reserved.</p>
                        <p>Built for CSE Department</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
