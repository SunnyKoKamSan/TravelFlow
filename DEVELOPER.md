# TravelFlow Pro - Developer Quick Reference 👨‍💻

Quick reference for developers working on TravelFlow.

## Project Structure at a Glance

```
TravelFlow/
├── src/
│   ├── components/          # React components
│   │   ├── Globe.tsx        # 3D globe visualization
│   │   ├── Header.tsx       # Header with mini globe
│   │   ├── MapPanel.tsx     # Interactive map view
│   │   ├── ItineraryView.tsx # Trip itinerary
│   │   ├── WalletView.tsx   # Expense tracking
│   │   ├── Wizard.tsx       # Trip creation wizard
│   │   ├── LoginView.tsx    # Auth UI
│   │   ├── NavBar.tsx       # Bottom navigation
│   │   └── FAB.tsx          # Floating action button
│   ├── hooks/               # React hooks
│   │   ├── useAuth.ts       # Firebase authentication
│   │   ├── useTrip.ts       # Trip state management
│   │   └── useDebounce.ts   # Debounce utility
│   ├── lib/                 # Libraries & utilities
│   │   ├── api.ts           # API calls (AI, weather, etc.)
│   │   ├── firebase.ts      # Firebase config
│   │   └── utils.ts         # Helper functions
│   ├── types/               # TypeScript interfaces
│   │   └── index.ts         # All type definitions
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # App entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── .env.example             # Environment variables template
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── vite.config.ts           # Vite config
├── tailwind.config.js       # Tailwind config
├── README.md                # User guide
├── SETUP_GUIDE.md           # Setup instructions
└── DEVELOPER.md             # This file

```

## Key Technologies

| Tech | Version | Purpose |
|------|---------|---------|
| React | 18 | UI framework |
| TypeScript | 5.2+ | Type safety |
| Vite | 5.0+ | Build tool |
| Firebase | 10.7+ | Backend & auth |
| Tailwind | 3.4+ | Styling |
| Leaflet | 1.9+ | Maps |
| Three.js | 0.160+ | 3D graphics |
| Phosphor | 1.4+ | Icons |

## Common Tasks

### Add a New Feature Component

```typescript
// components/NewFeature.tsx
import { FC } from 'react';

interface NewFeatureProps {
  title: string;
  onClick?: () => void;
}

const NewFeature: FC<NewFeatureProps> = ({ title, onClick }) => {
  return (
    <div className="p-4 bg-stone-50 rounded-lg">
      <h3 className="font-bold">{title}</h3>
      {onClick && <button onClick={onClick}>Action</button>}
    </div>
  );
};

export default NewFeature;
```

### Call an API

```typescript
// In a component or hook
import { askAI } from '@/lib/api';

const response = await askAI('Tokyo');
console.log(response);
```

### Use Trip Data

```typescript
// In a component
const { itinerary, settings, addItineraryItem } = useTrip(userId);

const addItem = async (location: string) => {
  await addItineraryItem({
    dayIndex: 0,
    time: '10:00',
    location,
    note: 'New activity',
  });
};
```

### Update Styles

```typescript
// src/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styles */
.glass-panel {
  @apply bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl;
}
```

## Testing

### Run Tests
```bash
npm run lint          # Check code quality
npm run build         # Compile TypeScript
npm run dev           # Start dev server
```

### Debug Tips
- Open DevTools: `F12`
- Check Console for errors
- Use React DevTools browser extension
- Use Vite HMR for fast feedback

## Common Patterns

### Modal Management
```typescript
const [showModal, setShowModal] = useState(false);

return (
  <>
    <button onClick={() => setShowModal(true)}>Open</button>
    {showModal && (
      <div className="modal">
        <button onClick={() => setShowModal(false)}>Close</button>
      </div>
    )}
  </>
);
```

### Form Handling
```typescript
const [formData, setFormData] = useState({ name: '', email: '' });

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
};

const handleSubmit = async () => {
  // Process formData
};
```

### Async Operations with Loading
```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const fetchData = async () => {
  setLoading(true);
  setError(null);
  try {
    const result = await someAsyncCall();
    // Handle result
  } catch (e) {
    setError(e instanceof Error ? e.message : 'Error occurred');
  } finally {
    setLoading(false);
  }
};
```

## Environment Variables

Create `.env.local` (never commit):
```env
# Firebase (Required)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# AI (Optional)
VITE_HF_API_KEY=...
```

Access in code:
```typescript
const apiKey = import.meta.env.VITE_HF_API_KEY;
```

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add my feature"

# Push and create PR
git push origin feature/my-feature

# After PR merge, update local
git checkout main
git pull origin main
```

## Performance Tips

- Use `useCallback` for stable function references
- Use `useMemo` for expensive computations
- Lazy load large components with `React.lazy`
- Optimize images and assets
- Code-split large features

## Security

- ✅ Never commit `.env.local`
- ✅ Keep Firebase keys in env only
- ✅ Use Firestore security rules in production
- ✅ Validate all user input
- ✅ Use HTTPS for all external APIs

## Debugging Firestore

```typescript
// In browser console
firebase.firestore().collection('users').get().then(snap => {
  snap.forEach(doc => console.log(doc.id, doc.data()));
});
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Styles not applying | Clear cache, restart dev server |
| Firebase not connecting | Check env vars, verify credentials |
| AI calls failing | Check API key, verify rate limit |
| Map not loading | Check internet, disable VPN |
| TypeScript errors | Run `npm run build` to see full errors |

## Deployment Checklist

- [ ] All env vars configured
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Firebase security rules configured
- [ ] Tested in production environment
- [ ] All user flows tested
- [ ] PWA manifest configured
- [ ] Performance checked (Lighthouse)

## Useful Links

- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Firebase Docs](https://firebase.google.com/docs)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [Vite Docs](https://vitejs.dev/guide/)

## Contact

Questions? Check:
1. README.md - User guide
2. SETUP_GUIDE.md - Setup instructions
3. Browser console - Error messages
4. GitHub issues - Known issues

---

**Happy coding! 🚀**
