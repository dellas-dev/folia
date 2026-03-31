export type MarketingLocale = 'en' | 'id'

export const MARKETING_LOCALE_COOKIE = 'folia_marketing_locale'

export const marketingCopy = {
  en: {
    nav: {
      community: 'Community',
      pricing: 'Pricing',
      signIn: 'Sign in',
      getStarted: 'Get started',
      openDashboard: 'Open dashboard',
    },
    hero: {
      badge: 'AI assets for digital product sellers',
      title: 'Create clipart and mockups that are ready for your next Etsy listing.',
      body: 'Folia helps you generate commercial-ready elements, themed illustration packs, and styled invitation mockups without building every asset from scratch.',
      ctaPrimary: 'Start for Rp 15.000',
      ctaSecondary: 'View pricing',
      exampleLabel: 'Example output',
      exampleBody: 'Clean Etsy-friendly artwork styles built for invites, stickers, wall art, and printable bundles.',
      examples: [
        'Watercolor florals for wedding invitations',
        'Kawaii animals for kids birthday printables',
        'Boho botanical elements for rustic templates',
      ],
    },
    howItWorks: {
      steps: [
        {
          title: 'Pick a style',
          body: 'Choose watercolor, line art, cartoon, boho, or minimalist based on the type of product you are building.',
        },
        {
          title: 'Write or upload',
          body: 'Describe the element you need, or upload your invitation design when you want a polished mockup scene.',
        },
        {
          title: 'Download PNG',
          body: 'Save clean commercial-ready outputs for your listing images, printable packs, and product bundles.',
        },
      ],
    },
    style: {
      eyebrow: 'Styles',
      title: 'Switch visual directions without changing tools.',
      link: 'Browse public examples',
    },
    occasion: {
      eyebrow: 'Occasions',
      title: 'Build asset packs for the events people actually shop for.',
      items: ['Wedding florals', 'Birthday characters', 'Christmas clipart', 'Halloween icons', 'Baby shower sets', 'Minimalist branding shapes'],
      mockupEyebrow: 'Mockups',
      mockupTitle: 'Turn flat invitation designs into styled listing photos.',
      mockupBody: 'Upload your design, pick a scene, and generate a polished product image that makes your storefront look more complete.',
      before: 'Before',
      beforeBody: 'Flat invitation artwork',
      after: 'After',
      afterBody: 'Styled tabletop mockup ready for listing thumbnails',
    },
    pricing: {
      eyebrow: 'Pricing',
      title: 'Start small, then scale into mockups and higher-volume output.',
      compare: 'Compare all plans',
      recurring: 'Recurring access',
      oneTime: 'One-time purchase',
      starterFocus: 'Element generation focus',
      powerFocus: 'Mockups and advanced workflow',
      topupFocus: 'Extra runs for active users',
      cards: {
        starter: 'For quick single-run assets and simple shop experiments.',
        pro: 'For active creators who need more variations, mockups, and affiliate access.',
        business: 'For higher-volume shops that want more credits and priority-ready setup.',
        topup: 'For customers who already have a plan and need more credits fast.',
      },
    },
    community: {
      eyebrow: 'Community',
      title: 'Preview what creators are already making.',
      link: 'Open community gallery',
      body: 'Explore public generations in this style and see how different shops approach occasions, bundles, and listing visuals.',
    },
    faq: {
      eyebrow: 'FAQ',
      items: [
        ['Who is Folia built for?', 'Folia is designed for Etsy sellers, invitation designers, printable creators, and digital product studios that need fresh visual assets quickly.'],
        ['Do I get transparent PNG outputs?', 'Element generations are designed for transparent PNG-style workflows so they can fit into invitations, stickers, and product listings.'],
        ['Can I generate mockups too?', 'Yes. Pro and Business plans include invitation mockup tools so you can turn flat designs into styled listing images.'],
        ['Is there a free tier?', 'No. Folia starts with a paid entry tier to reduce abuse and keep credits focused on serious sellers.'],
      ],
    },
    footer: {
      eyebrow: 'Folia',
      title: 'Create faster. Publish cleaner. Grow your catalog.',
      primary: 'Create account',
      secondary: 'View pricing',
    },
    language: {
      label: 'Language',
      en: 'EN',
      id: 'ID',
    },
  },
  id: {
    nav: {
      community: 'Komunitas',
      pricing: 'Harga',
      signIn: 'Masuk',
      getStarted: 'Mulai sekarang',
      openDashboard: 'Buka dashboard',
    },
    hero: {
      badge: 'Aset AI untuk penjual produk digital',
      title: 'Buat clipart dan mockup yang siap untuk listing Etsy berikutnya.',
      body: 'Folia membantu Anda membuat elemen visual siap jual, paket ilustrasi tematik, dan mockup undangan tanpa harus membuat semuanya dari nol.',
      ctaPrimary: 'Mulai dari Rp 15.000',
      ctaSecondary: 'Lihat harga',
      exampleLabel: 'Contoh hasil',
      exampleBody: 'Gaya artwork ramah Etsy untuk undangan, stiker, wall art, dan bundle printable.',
      examples: [
        'Bunga watercolor untuk undangan pernikahan',
        'Hewan kawaii untuk printable ulang tahun anak',
        'Elemen botanikal boho untuk template rustic',
      ],
    },
    howItWorks: {
      steps: [
        {
          title: 'Pilih gaya',
          body: 'Pilih watercolor, line art, cartoon, boho, atau minimalist sesuai jenis produk yang ingin dibuat.',
        },
        {
          title: 'Tulis atau unggah',
          body: 'Deskripsikan elemen yang dibutuhkan, atau unggah desain undangan saat Anda ingin membuat mockup scene yang lebih polished.',
        },
        {
          title: 'Unduh PNG',
          body: 'Simpan hasil siap pakai untuk listing, printable pack, dan bundle produk digital Anda.',
        },
      ],
    },
    style: {
      eyebrow: 'Gaya',
      title: 'Ganti arah visual tanpa perlu ganti alat.',
      link: 'Lihat contoh publik',
    },
    occasion: {
      eyebrow: 'Momen',
      title: 'Bangun asset pack untuk momen yang benar-benar dicari pembeli.',
      items: ['Bunga pernikahan', 'Karakter ulang tahun', 'Clipart Natal', 'Ikon Halloween', 'Set baby shower', 'Bentuk branding minimalis'],
      mockupEyebrow: 'Mockup',
      mockupTitle: 'Ubah desain undangan datar menjadi foto listing yang lebih hidup.',
      mockupBody: 'Unggah desain Anda, pilih scene, lalu buat gambar produk yang membuat storefront terlihat lebih lengkap.',
      before: 'Sebelum',
      beforeBody: 'Artwork undangan datar',
      after: 'Sesudah',
      afterBody: 'Mockup meja bergaya yang siap dipakai untuk thumbnail listing',
    },
    pricing: {
      eyebrow: 'Harga',
      title: 'Mulai kecil, lalu scale ke mockup dan output volume lebih tinggi.',
      compare: 'Bandingkan semua paket',
      recurring: 'Akses berulang',
      oneTime: 'Pembelian sekali',
      starterFocus: 'Fokus generate elemen',
      powerFocus: 'Mockup dan workflow lanjutan',
      topupFocus: 'Tambahan run untuk user aktif',
      cards: {
        starter: 'Untuk asset cepat satu kali dan eksperimen toko sederhana.',
        pro: 'Untuk kreator aktif yang butuh lebih banyak variasi, mockup, dan akses affiliate.',
        business: 'Untuk toko volume lebih tinggi yang butuh lebih banyak credits dan setup lebih siap.',
        topup: 'Untuk pelanggan yang sudah punya paket dan butuh credits tambahan dengan cepat.',
      },
    },
    community: {
      eyebrow: 'Komunitas',
      title: 'Lihat apa yang sudah dibuat creator lain.',
      link: 'Buka galeri komunitas',
      body: 'Jelajahi hasil publik di gaya ini dan lihat bagaimana toko lain mengerjakan occasion, bundle, dan visual listing mereka.',
    },
    faq: {
      eyebrow: 'FAQ',
      items: [
        ['Folia dibuat untuk siapa?', 'Folia dibuat untuk penjual Etsy, desainer undangan, pembuat printable, dan studio produk digital yang butuh aset visual baru dengan cepat.'],
        ['Apakah hasilnya PNG transparan?', 'Hasil element generation dirancang untuk workflow PNG transparan sehingga mudah dipakai di undangan, stiker, dan listing produk.'],
        ['Apakah saya bisa buat mockup juga?', 'Bisa. Paket Pro dan Business mencakup tools mockup undangan agar desain datar bisa diubah menjadi gambar listing yang lebih menarik.'],
        ['Apakah ada paket gratis?', 'Tidak. Folia mulai dari paket berbayar untuk mengurangi abuse dan menjaga credits tetap fokus ke seller yang serius.'],
      ],
    },
    footer: {
      eyebrow: 'Folia',
      title: 'Buat lebih cepat. Publish lebih rapi. Tumbuhkan katalog Anda.',
      primary: 'Buat akun',
      secondary: 'Lihat harga',
    },
    language: {
      label: 'Bahasa',
      en: 'EN',
      id: 'ID',
    },
  },
} as const
