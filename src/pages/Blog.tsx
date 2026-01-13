/**
 * Página de Blog do AgroSaldo
 * Artigos sobre gestão pecuária, dicas e tutoriais
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Clock, ArrowRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  image: string;
}

const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Como Registrar Nascimentos Offline e Sincronizar Automaticamente',
    excerpt: 'Aprenda a usar o modo offline do AgroSaldo para registrar nascimentos mesmo sem internet e sincronizar quando a conexão voltar.',
    content: `O AgroSaldo foi desenvolvido pensando na realidade do campo brasileiro, onde nem sempre há internet disponível. Aqui está um guia completo de como usar o modo offline...`,
    author: 'João Silva',
    date: '2026-01-10',
    readTime: '5 min',
    category: 'Tutorial',
    image: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800',
  },
  {
    id: '2',
    title: 'Compliance Sanitária: O Que Todo Pecuarista Precisa Saber',
    excerpt: 'Entenda as exigências de órgãos como INDEA, IAGRO e ADAPAR e como manter sua propriedade em conformidade.',
    content: `A conformidade sanitária é fundamental para qualquer operação pecuária. Neste artigo, vamos abordar os principais requisitos...`,
    author: 'Maria Santos',
    date: '2026-01-08',
    readTime: '7 min',
    category: 'Legislação',
    image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800',
  },
  {
    id: '3',
    title: 'Evolução Automática de Faixas Etárias: Como Funciona',
    excerpt: 'Descubra como o AgroSaldo calcula automaticamente a idade do seu rebanho e move os animais entre categorias.',
    content: `Uma das funcionalidades mais poderosas do AgroSaldo é a evolução automática de faixas etárias...`,
    author: 'Carlos Oliveira',
    date: '2026-01-05',
    readTime: '6 min',
    category: 'Tecnologia',
    image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800',
  },
  {
    id: '4',
    title: '5 Erros Comuns na Gestão de Rebanho e Como Evitá-los',
    excerpt: 'Conheça os principais erros que pecuaristas cometem ao gerenciar seus rebanhos e aprenda a evitá-los com o AgroSaldo.',
    content: `Ao longo de anos trabalhando com pecuaristas, identificamos 5 erros recorrentes que podem comprometer a gestão do rebanho...`,
    author: 'Ana Paula Costa',
    date: '2026-01-03',
    readTime: '8 min',
    category: 'Gestão',
    image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800',
  },
  {
    id: '5',
    title: 'Gerando Relatórios em PDF: Guia Completo',
    excerpt: 'Tutorial passo a passo para gerar o Espelho Oficial do Rebanho em PDF e compartilhar via WhatsApp.',
    content: `O relatório em PDF é uma das funcionalidades mais utilizadas do AgroSaldo. Veja como gerar e compartilhar...`,
    author: 'Pedro Mendes',
    date: '2026-01-01',
    readTime: '4 min',
    category: 'Tutorial',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
  },
];

export default function Blog() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  const categories = Array.from(new Set(blogPosts.map(post => post.category)));

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-sm mb-6 hover:opacity-80">
            <ArrowLeft className="w-4 h-4" />
            Voltar para Home
          </Link>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Blog AgroSaldo
          </h1>
          <p className="text-lg opacity-90">
            Dicas, tutoriais e insights sobre gestão pecuária inteligente
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-4xl mx-auto px-4 -mt-8">
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar artigos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedCategory === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  Todos
                </Button>
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Blog Posts */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {filteredPosts.map((post, index) => (
            <Card 
              key={post.id}
              className="overflow-hidden hover:shadow-lg transition-shadow animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="md:flex">
                <div className="md:w-1/3">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-48 md:h-full object-cover"
                  />
                </div>
                <div className="md:w-2/3">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{post.category}</Badge>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime}
                      </span>
                    </div>
                    <h2 className="font-display text-2xl font-bold mb-2 hover:text-primary transition-colors">
                      <Link to={`/blog/${post.id}`}>{post.title}</Link>
                    </h2>
                    <p className="text-muted-foreground">{post.excerpt}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {post.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(post.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <Link to={`/blog/${post.id}`}>
                        <Button variant="ghost" size="sm">
                          Ler mais
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                Nenhum artigo encontrado. Tente ajustar sua busca.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Newsletter CTA */}
      <div className="bg-muted py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl font-bold mb-4">
            Receba nossas atualizações
          </h2>
          <p className="text-muted-foreground mb-6">
            Cadastre-se para receber dicas semanais de gestão pecuária
          </p>
          <div className="flex gap-2 max-w-md mx-auto">
            <Input placeholder="Seu e-mail" type="email" />
            <Button>Inscrever</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
