'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Play, Volume2, Sparkles, Mic2, Shield, Zap, Download } from 'lucide-react';

export default function LandingPage() {
  const [text, setText] = useState('Kokoro is an open-weight TTS model with 82 million parameters. Despite its lightweight architecture, it delivers comparable quality to larger models while being significantly faster and more cost-efficient.');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-purple-500/30">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-8 flex justify-between items-center bg-transparent backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Volume2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Suara</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <a href="#" className="hover:text-white transition-colors">Platform</a>
          <a href="#" className="hover:text-white transition-colors">Voices</a>
          <a href="#" className="hover:text-white transition-colors">API</a>
          <a href="#" className="hover:text-white transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-gray-400 hover:text-white">Sign In</Button>
          <Button className="bg-white text-black hover:bg-gray-200 transition-all font-semibold rounded-full px-6">Get Started</Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-20 pb-32 text-center relative overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/10 blur-[120px] rounded-full -z-10" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="outline" className="mb-6 border-purple-500/30 text-purple-400 bg-purple-500/5 px-4 py-1 rounded-full text-xs animate-pulse">
            <Sparkles className="w-3 h-3 mr-2" />
            Empowered by Kokoro v0.19
          </Badge>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
            The Most Human<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400">
              AI Voices
            </span> Ever Created.
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
            Generate ultra-realistic voices for your videos, games, and applications.
            Suara brings the next generation of Text-to-Speech to your own infrastructure.
          </p>
        </motion.div>

        {/* Dynamic UI Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="max-w-4xl mx-auto relative group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-[2rem] blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 -z-10" />

          <Card className="bg-[#111] border-white/5 backdrop-blur-sm shadow-2xl rounded-[1.5rem] overflow-hidden">
            <CardHeader className="border-b border-white/5 bg-white/5 p-6 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Mic2 className="w-5 h-5 text-purple-400" /> Speech Studio
                  </CardTitle>
                </div>
                <div className="flex gap-2">
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-none">API: Active</Badge>
                  <Badge className="bg-blue-500/10 text-blue-400 border-none">Model: Kokoro 82M</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <Label className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Script</Label>
                  <span className="text-xs text-gray-600">{text.length}/1000 characters</span>
                </div>
                <textarea
                  className="w-full h-40 bg-black/40 border border-white/10 rounded-2xl p-6 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none transition-all placeholder:text-gray-700"
                  placeholder="Type or paste your text here..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <Label className="text-xs text-gray-500 uppercase tracking-widest">Select Voice</Label>
                    </div>
                    <Tabs defaultValue="adam" className="w-full">
                      <TabsList className="grid grid-cols-3 bg-black/40 p-1 rounded-xl h-auto">
                        <TabsTrigger value="adam" className="rounded-lg py-2 data-[state=active]:bg-white/10">Adam</TabsTrigger>
                        <TabsTrigger value="sarah" className="rounded-lg py-2 data-[state=active]:bg-white/10">Sarah</TabsTrigger>
                        <TabsTrigger value="james" className="rounded-lg py-2 data-[state=active]:bg-white/10">James</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <Label className="text-xs text-gray-500 uppercase tracking-widest text-left">Stability</Label>
                      <span className="text-xs text-purple-400 font-bold">75%</span>
                    </div>
                    <Slider defaultValue={[75]} max={100} step={1} className="py-2" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-white/5 p-6 flex items-center justify-between border-t border-white/5">
              <div className="flex items-center gap-4">
                <Button size="icon" variant="ghost" className="rounded-full w-12 h-12 bg-white/5 hover:bg-white/20">
                  <Download className="w-5 h-5" />
                </Button>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`
                  h-14 px-10 rounded-full font-bold text-lg shadow-xl shadow-purple-500/20 
                  ${isGenerating ? 'bg-gray-800' : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-105 transition-transform'}
                `}
              >
                {isGenerating ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="mr-2 border-2 border-white/30 border-t-white rounded-full w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 mr-2 fill-current" />
                )}
                {isGenerating ? 'Synthesizing...' : 'Generate Voice'}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section className="container mx-auto px-6 py-32 border-t border-white/5 bg-gradient-to-b from-transparent to-black/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <FeatureCard
            icon={<Zap className="w-8 h-8 text-yellow-400" />}
            title="Real-time Processing"
            description="Built for extreme speed. Our optimized Kokoro architecture delivers latency under 100ms for short sentences."
          />
          <FeatureCard
            icon={<Shield className="w-8 h-8 text-blue-400" />}
            title="Self-Hosted Privacy"
            description="Your data never leaves your infrastructure. Compatible with S3 and local storage for maximum security."
          />
          <FeatureCard
            icon={<Sparkles className="w-8 h-8 text-purple-400" />}
            title="Ultra-Fine Controls"
            description="Tweak stability, clarity, and pacing with a granular control system designed for expressive speech."
          />
        </div>
      </section>

      <footer className="border-t border-white/5 py-12 text-center text-gray-600 text-sm">
        <p>&copy; 2026 Suara AI Platform. Built with Next.js, Fastify & Kokoro.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
      <div className="mb-6 p-4 bg-white/5 w-fit rounded-2xl group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <p className="text-gray-500 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
