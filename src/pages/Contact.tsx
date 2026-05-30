import Header from '@/components/Header';
import { useApp } from '@/context/AppContext';

export default function Contact() {
  const { t } = useApp();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="bg-card rounded-xl border border-border p-8 max-w-sm w-full">
          <h1 className="text-xl font-bold text-center text-foreground mb-6">
            {t('ติดต่อเรา', 'Contact Us')}
          </h1>
          <div className="space-y-3">
            {[
              {
                icon: '📘',
                label: 'FACEBOOK : TOP LAGACY BOARD GAME',
                href: 'https://facebook.com',
                bg: 'from-blue-50 to-blue-100 border-blue-200',
              },
              {
                icon: '✉️',
                label: 'GMAIL : tioplagacyboardgame@gmail.com',
                href: 'mailto:tioplagacyboardgame@gmail.com',
                bg: 'from-red-50 to-red-100 border-red-200',
              },
              {
                icon: '📞',
                label: 'PHON NUMBER : XXX - XXX - XXXX',
                href: 'tel:+66000000000',
                bg: 'from-gray-50 to-gray-100 border-gray-200',
              },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center gap-3 bg-gradient-to-r ${item.bg} border rounded-lg px-4 py-3 hover:brightness-95 transition-all`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-sm text-foreground font-medium">{item.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
