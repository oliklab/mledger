import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const productName = process.env.NEXT_PUBLIC_PRODUCTNAME;
  const testimonials = [
    {
      quote: "I was drowning in a spreadsheet nightmare. Maker's Ledger gave me clarity on my costs in minutes. The Recipe feature is a huge time-saver and finally lets me focus on creating, not calculating.",
      author: "Sabrina Chen",
      role: "Solo Founder",
      avatar: "SC"
    },
    {
      quote: "I tried other inventory apps, but they were too complex and expensive for my small shop. The best part about Maker's Ledger is its simplicity. It does exactly what I need - tracks my materials and costs without the bloat.",
      author: "Maria Rodriguez",
      role: "Artisan",
      avatar: "MR"
    },
    {
      quote: "I had no idea if I was actually making a profit. Maker's Ledger was a game-changer; seeing my exact cost per item in real-time gave me the confidence to price my products correctly. I couldn't run my business without it.",
      author: "Aaron McCabes",
      role: "Solo Maker",
      avatar: "AK"
    }
  ];

  return (
    <div className="flex min-h-screen">
      <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white relative">
        <Link
          href="/"
          className="absolute left-8 top-8 flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Homepage
        </Link>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            {productName}
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          {children}
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800">
        <div className="w-full flex items-center justify-center p-12">
          <div className="space-y-6 max-w-lg">
            <h3 className="text-white text-2xl font-bold mb-8">
              Trusted by Maker's worldwide
            </h3>
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="relative bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 shadow-xl"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary-400/30 flex items-center justify-center text-white font-semibold">
                      {testimonial.avatar}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/90 mb-2 font-light leading-relaxed">
                      &#34;{testimonial.quote}&#34;
                    </p>
                    <div className="mt-3">
                      <p className="text-sm font-medium text-white">
                        {testimonial.author}
                      </p>
                      <p className="text-sm text-primary-200">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-8 text-center">
              <p className="text-primary-100 text-sm">
                Join thousands of makers building with Maker's Ledger.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}