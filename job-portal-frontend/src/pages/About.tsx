import React from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  Users,
  Target,
  Heart,
  Award,
  Shield,
  TrendingUp,
  Globe,
  CheckCircle,
  Zap,
  Building,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

const About: React.FC = () => {
  const values = [
    {
      icon: Target,
      title: 'Our Mission',
      description: 'To connect talented professionals with meaningful career opportunities and help businesses build exceptional teams.',
      color: 'bg-blue-500'
    },
    {
      icon: Eye,
      title: 'Our Vision',
      description: 'To become the world\'s most trusted job portal, empowering millions of careers globally.',
      color: 'bg-purple-500'
    },
    {
      icon: Heart,
      title: 'Our Values',
      description: 'Integrity, innovation, inclusivity, and excellence in everything we do.',
      color: 'bg-pink-500'
    }
  ]

  const stats = [
    { label: 'Active Jobs', value: '10+', icon: Briefcase },
    { label: 'Companies', value: '5+', icon: Building },
    { label: 'Job Seekers', value: '50+', icon: Users },
    { label: 'Success Rate', value: '95%', icon: TrendingUp },
    { label: 'Countries', value: '50+', icon: Globe },
    { label: 'Years of Trust', value: '10+', icon: Award }
  ]

  const team = [
    {
      name: 'Mekdes Wale',
      role: 'CEO & Founder',
      bio: 'Former tech executive with 15+ years of experience in recruitment technology.',
      avatar: 'MW'
    },
    {
      name: 'Ayenalem',
      role: 'Head of Operations',
      bio: 'Passionate about creating seamless user experiences and driving growth.',
      avatar: 'AY'
    },
    {
      name: 'Natnael',
      role: 'CTO',
      bio: 'Technology leader building scalable platforms for millions of users.',
      avatar: 'NA'
    },
    {
      name: 'Surafel',
      role: 'Head of Marketing',
      bio: 'Expert in digital marketing and employer branding strategies.',
      avatar: 'SU'
    }
  ]

  const milestones = [
    { year: '2014', title: 'Company Founded', description: 'Started our journey to revolutionize job searching' },
    { year: '2016', title: '1 Million Users', description: 'Reached our first million job seekers' },
    { year: '2018', title: 'Global Expansion', description: 'Expanded services to 50+ countries' },
    { year: '2020', title: 'AI Matching', description: 'Launched AI-powered job matching algorithm' },
    { year: '2022', title: '10K+ Companies', description: 'Served over 10,000 businesses worldwide' },
    { year: '2024', title: 'Future Ready', description: 'Continuing to innovate and grow' }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-linear-to-br from-blue-600 to-indigo-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-white/20 text-white border-0">
            <Zap className="h-3 w-3 mr-1" />
            Our Story
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Connecting Talent with Opportunity
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Since 2014, we've been on a mission to revolutionize the way people find jobs 
            and companies hire talent.
          </p>
        </div>
      </section>

      {/* Mission/Vision/Values */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value) => {
              const Icon = value.icon
              return (
                <Card key={value.title} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className={`${value.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                    <p className="text-gray-600">{value.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Impact by the Numbers</h2>
            <p className="text-lg text-gray-600">Making a difference in the job market</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="text-center">
                  <Icon className="h-8 w-8 mx-auto text-blue-600 mb-3" />
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-blue-100 text-blue-700">Our Journey</Badge>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">How It All Started</h2>
              <p className="text-gray-600 mb-4">
                JobPortal was founded in 2014 with a simple yet powerful vision: to make job searching 
                easier, faster, and more effective for everyone. What started as a small startup has 
                grown into a global platform connecting millions of job seekers with their dream careers.
              </p>
              <p className="text-gray-600 mb-6">
                Today, we're proud to serve thousands of businesses and job seekers across 50+ countries, 
                helping them find the perfect match for their needs. Our AI-powered matching technology 
                ensures that candidates find relevant opportunities and employers find qualified talent.
              </p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Trusted Platform</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Secure & Reliable</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">24/7 Support</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-linear-to-br from-blue-100 to-indigo-100 rounded-2xl p-8">
                <div className="grid grid-cols-2 gap-4">
                  {milestones.slice(0, 4).map((milestone) => (
                    <div key={milestone.year} className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-2xl font-bold text-blue-600">{milestone.year}</p>
                      <p className="font-semibold text-gray-900">{milestone.title}</p>
                      <p className="text-xs text-gray-500">{milestone.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Milestones</h2>
            <p className="text-lg text-gray-600">Key moments in our journey</p>
          </div>
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-blue-200 hidden md:block" />
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={milestone.year} className={`flex flex-col md:flex-row ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8`}>
                  <div className="flex-1 md:text-right">
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <p className="text-3xl font-bold text-blue-600">{milestone.year}</p>
                      <h3 className="text-xl font-semibold mt-2">{milestone.title}</h3>
                      <p className="text-gray-600 mt-2">{milestone.description}</p>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <div className="w-8 h-8 bg-blue-600 rounded-full border-4 border-white shadow-md" />
                  </div>
                  <div className="flex-1 md:text-left" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Leadership Team</h2>
            <p className="text-lg text-gray-600">The passionate people behind JobPortal</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
              <Card key={member.name} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <Avatar className="h-24 w-24 mx-auto mb-4">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                      {member.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-lg font-semibold">{member.name}</h3>
                  <p className="text-sm text-blue-600 mb-2">{member.role}</p>
                  <p className="text-sm text-gray-500">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose JobPortal?</h2>
            <p className="text-lg text-gray-600">What makes us different</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Trust & Security</CardTitle>
                <CardDescription>Verified employers and secure platform</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">All employers are verified, and your data is protected with enterprise-grade security.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>AI-Powered Matching</CardTitle>
                <CardDescription>Smart recommendations for better matches</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Our advanced algorithm suggests jobs that match your skills and preferences.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Globe className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Global Reach</CardTitle>
                <CardDescription>Opportunities from around the world</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Access jobs from top companies in 50+ countries worldwide.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-linear-to-r from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Join Our Community Today</h2>
          <p className="text-lg text-blue-100 mb-8">
            Start your journey with thousands of successful job seekers and employers
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="default" className="bg-white text-blue-600 hover:bg-gray-100" asChild>
              <Link to="/register">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About