import React, { useState } from 'react';
import { Card, Badge, Container, Row, Col, Button } from 'react-bootstrap';
import { Star, CheckCircle, Globe, Quote, ChevronDown, ChevronUp, Clock, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

const reviewsData = [
  {
    id: 'rev-1',
    username: 'hillfamilybiz',
    country: 'United States',
    flag: '🇺🇸',
    rating: 5,
    timeAgo: '4 months ago',
    review: "Did a wonderful job! It’s a long term project. They understand concept and vision. Will continue to work with them to complete full scope",
    projectScope: 'Full Stack Web Applications',
    duration: '3 weeks',
    badge: null,
    avatarBg: '#8B5CF6', // Purple
    initials: 'H',
    avatarUrl: null
  },
  {
    id: 'rev-2',
    username: 'pop1010',
    country: 'United States',
    flag: '🇺🇸',
    rating: 5,
    timeAgo: '3 months ago',
    review: "Best developer ever, always listening and make adjustments to every bugs snd response to messages every seconds",
    projectScope: 'Full Stack Web Applications',
    duration: '1 day',
    badge: null,
    avatarBg: '#5A6E14', // Olive Green matching reference image
    initials: 'P',
    avatarUrl: null
  },
  {
    id: 'rev-3',
    username: 'jjbralm',
    country: 'United States',
    flag: '🇺🇸',
    rating: 5,
    timeAgo: '1 day ago',
    review: "She is exceptionally diligent, professional, and committed to delivering high-quality work. She understands the assignment thoroughly and pays close attention to every detail. I particularly appreciated her willingness to carefully review and address every correction and feedback I provided throughout the application process. Her communication was outstanding clear, timely, professional, and respectful. At every stage, she kept me informed and ensured I understood what was being done and why. I never felt out of the loop or uncertain about the progress of my application. I highly recommend her to anyone looking for someone who is reliable, detail-oriented, responsive, and genuinely committed.",
    projectScope: 'Full Stack Web Applications',
    duration: null,
    badge: null,
    avatarBg: '#0D9488', // Teal
    initials: 'J',
    avatarUrl: null
  },
  {
    id: 'rev-4',
    username: 'immanuelpaul832',
    country: 'Jamaica',
    flag: '🇯🇲',
    rating: 5,
    timeAgo: '4 weeks ago',
    review: "As a returning customer, I highly recommend Nalini Paras. She consistently delivers exceptional quality, professionalism, and attention to detail. Outstanding work every time—truly deserving of a 5-star rating!",
    projectScope: 'Full Stack Web Applications',
    duration: '4 days',
    badge: 'Ongoing collaboration',
    avatarBg: '#2563EB',
    initials: 'I',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&q=80'
  },
  {
    id: 'rev-5',
    username: 'kellyheflin',
    country: 'United States',
    flag: '🇺🇸',
    rating: 5,
    timeAgo: '3 months ago',
    review: "Nalini and her team provided exceptional work on the frontend wireframes for our project. They quickly understood a fairly complex sports-analytics product and translated loose ideas into a clean, intuitive layout that fits our target users perfectly. Communication was fast and clear throughout the process, and they were always open to feedback and iteration without needing a lot of hand-holding. The delivered wireframes were organized, consistent, and developer-friendly, making it easy for our dev team to move straight into implementation. Timelines and expectations were met exactly as promised, and they added thoughtful UX suggestions that actually improved the original concept instead of just following instructions. Overall, highly professional, reliable, and a pleasure to work with. I will definitely work with Nalini and her team again on future UI/UX and frontend planning work.",
    projectScope: 'UI/UX & Frontend Architecture',
    duration: '2 weeks',
    badge: null,
    avatarBg: '#DC2626',
    initials: 'K',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&q=80'
  }
];

const PayrollTestimonialsSection = () => {
  const [expandedReviews, setExpandedReviews] = useState({});

  const toggleExpand = (id) => {
    setExpandedReviews(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section 
      id="testimonials" 
      style={{ 
        backgroundColor: '#FAFAFA', 
        paddingTop: '90px', 
        paddingBottom: '90px',
        borderTop: '1px solid #E2E8F0',
        borderBottom: '1px solid #E2E8F0',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Container>
        
        {/* Section Header */}
        <div className="text-center mb-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div 
              className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3"
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#C62828',
                fontSize: '12px',
                fontWeight: '700',
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}
            >
              <Quote size={14} /> Client Reviews & Verified Feedback
            </div>
            
            <h2 className="display-6 fw-bold mb-3" style={{ color: '#0F172A' }}>
              Loved by Corporate Clients & <span style={{ color: '#C62828' }}>Global Businesses</span>
            </h2>
            
            <p className="lead text-muted mx-auto" style={{ maxWidth: '680px', fontSize: '16px' }}>
              Real feedback from global clients who trust our engineering, full-stack payroll, UI/UX precision, and technical execution.
            </p>
          </motion.div>
        </div>

        {/* 5 Reviews Grid */}
        <Row className="g-4 justify-content-center">
          {reviewsData.map((rev, index) => {
            const isLong = rev.review.length > 220;
            const isExpanded = expandedReviews[rev.id];
            const displayedText = isLong && !isExpanded ? rev.review.slice(0, 220) + '...' : rev.review;

            return (
              <Col key={rev.id} lg={index < 2 ? 6 : (index === 2 ? 12 : 6)} md={12}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '16px',
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                      transition: 'all 0.25s ease',
                      height: '100%',
                      padding: '24px'
                    }}
                    className="h-100 shadow-hover"
                  >
                    {/* Top Row: User Avatar, Name, Flag, and Badge */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="d-flex align-items-center gap-3">
                        {/* Avatar */}
                        {rev.avatarUrl ? (
                          <img
                            src={rev.avatarUrl}
                            alt={rev.username}
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '2px solid #F1F5F9'
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '50%',
                              backgroundColor: rev.avatarBg,
                              color: '#FFFFFF',
                              fontWeight: '800',
                              fontSize: '18px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                            }}
                          >
                            {rev.initials}
                          </div>
                        )}

                        <div>
                          <div style={{ fontWeight: '800', fontSize: '15px', color: '#0F172A', lineHeight: 1.2 }}>
                            {rev.username}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                            <span>{rev.flag}</span>
                            <span>{rev.country}</span>
                          </div>
                        </div>
                      </div>

                      {/* Optional Ongoing Collaboration Badge */}
                      {rev.badge && (
                        <Badge 
                          bg="light" 
                          text="dark" 
                          style={{
                            borderRadius: '16px',
                            padding: '6px 12px',
                            border: '1px solid #CBD5E1',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}
                        >
                          {rev.badge}
                        </Badge>
                      )}
                    </div>

                    <hr style={{ margin: '12px 0 16px 0', borderColor: '#F1F5F9' }} />

                    {/* Rating Stars & Time */}
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <div className="d-flex text-warning">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} size={16} fill="#F59E0B" color="#F59E0B" />
                        ))}
                      </div>
                      <span style={{ fontWeight: '800', fontSize: '14px', color: '#0F172A' }}>{rev.rating}</span>
                      <span style={{ color: '#94A3B8', fontSize: '12px' }}>•</span>
                      <span style={{ color: '#64748B', fontSize: '12px' }}>{rev.timeAgo}</span>
                    </div>

                    {/* Review Text Body */}
                    <div style={{ color: '#334155', fontSize: '14px', lineHeight: 1.6, flex: 1 }}>
                      {displayedText}
                      {isLong && (
                        <button
                          onClick={() => toggleExpand(rev.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#C62828',
                            fontWeight: '700',
                            fontSize: '13px',
                            padding: '0 0 0 6px',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          {isExpanded ? 'See less' : 'See more'}
                        </button>
                      )}
                    </div>

                    {/* Footer Tag / Duration Metadata */}
                    {rev.projectScope && (
                      <div className="mt-4 pt-3 d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ borderTop: '1px solid #F1F5F9' }}>
                        <div className="d-flex align-items-center gap-2">
                          <Badge 
                            bg="light" 
                            text="dark"
                            style={{
                              border: '1px solid #E2E8F0',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: '600',
                              color: '#475569'
                            }}
                          >
                            <Layers size={12} className="me-1" />
                            {rev.projectScope}
                          </Badge>
                        </div>

                        {rev.duration && (
                          <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} />
                            <strong>{rev.duration}</strong> duration
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </motion.div>
              </Col>
            );
          })}
        </Row>

        {/* Bottom Trust Badge */}
        <div className="mt-5 text-center">
          <div className="d-inline-flex align-items-center gap-2 px-4 py-2 rounded-pill bg-white shadow-sm border">
            <CheckCircle size={18} color="#166534" />
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
              100% Verified 5-Star Reviews from Global Enterprise Clients
            </span>
          </div>
        </div>

      </Container>
    </section>
  );
};

export default PayrollTestimonialsSection;
