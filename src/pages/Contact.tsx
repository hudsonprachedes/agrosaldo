/**
 * Página de Contato do AgroSaldo
 * Formulário de contato com validação Zod e link WhatsApp
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { MaskedInput } from '@/components/ui/masked-input';
import usePageMeta from '@/hooks/usePageMeta';
import { organizationSchema } from '@/lib/seo';
import { notifyFirstFormError } from '@/lib/form-errors';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const contactSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos').optional(),
  subject: z.string().min(5, 'Assunto deve ter pelo menos 5 caracteres'),
  message: z.string().min(20, 'Mensagem deve ter pelo menos 20 caracteres'),
});

type ContactFormData = z.infer<typeof contactSchema>;

const WHATSAPP_NUMBER = '5544991147084'; // Substituir pelo número real

export default function Contact() {
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    },
  });

  usePageMeta({
    page: 'contact',
    structuredData: {
      id: 'contact-organization-schema',
      data: {
        ...organizationSchema,
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          telephone: '+55-67-99999-9999',
          areaServed: 'BR',
          availableLanguage: 'pt-BR',
        },
      },
    },
  });

  const onSubmit = (data: ContactFormData) => {
    // Simular envio - em produção, integrar com backend
    console.log('Contact form data:', data);
    
    toast.success('Mensagem enviada com sucesso!', {
      description: 'Nossa equipe entrará em contato em breve.',
    });

    form.reset();
  };

  const onInvalid = () => {
    const { toastMessage } = notifyFirstFormError(form.formState.errors as any, {
      setFocus: form.setFocus,
      title: 'Ops! Tem um detalhe para ajustar:',
    });
    toast.error(toastMessage);
  };

  const openWhatsApp = () => {
    const message = encodeURIComponent('Olá! Gostaria de saber mais sobre o AgroSaldo.');
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

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
            Entre em Contato
          </h1>
          <p className="text-lg opacity-90">
            Estamos aqui para ajudar. Envie sua mensagem ou fale conosco via WhatsApp
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações de Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm mb-1">E-mail</p>
                    <a href="mailto:contato@agrosaldo.com.br" className="text-sm text-muted-foreground hover:text-primary">
                      contato@agrosaldo.com.br
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm mb-1">Telefone</p>
                    <a href="tel:+556799999999" className="text-sm text-muted-foreground hover:text-primary">
                      (67) 99999-9999
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm mb-1">Endereço</p>
                    <p className="text-sm text-muted-foreground">
                      Campo Grande, MS<br />
                      Brasil
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* WhatsApp Card */}
            <Card className="bg-success text-success-foreground border-success">
              <CardContent className="p-6 text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Fale pelo WhatsApp</h3>
                <p className="text-sm opacity-90 mb-4">
                  Atendimento rápido e direto
                </p>
                <Button
                  onClick={openWhatsApp}
                  variant="secondary"
                  className="w-full"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Abrir WhatsApp
                </Button>
              </CardContent>
            </Card>

            {/* Business Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Horário de Atendimento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Segunda - Sexta</span>
                    <span className="font-medium">8h - 18h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sábado</span>
                    <span className="font-medium">Fechado</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Domingo</span>
                    <span className="font-medium">Fechado</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Envie sua Mensagem</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome *</FormLabel>
                            <FormControl>
                              <Input placeholder="Seu nome completo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="seu@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <MaskedInput
                                mask="(99) 99999-9999"
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                placeholder="(00) 00000-0000"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assunto *</FormLabel>
                            <FormControl>
                              <Input placeholder="Sobre o que deseja falar?" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mensagem *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descreva sua dúvida ou solicitação..."
                              rows={6}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" size="lg" className="w-full">
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Mensagem
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-muted py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-3xl font-bold mb-8 text-center">
            Perguntas Frequentes
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Como funciona o período de teste?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Você tem 7 dias gratuitos para testar todas as funcionalidades sem compromisso.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Posso mudar de plano depois?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Sim! Você pode fazer upgrade ou downgrade a qualquer momento.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Os dados ficam seguros?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Sim. Usamos criptografia de ponta e backups automáticos diários.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Funciona offline?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Sim! O app mobile funciona 100% offline e sincroniza quando voltar internet.
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
