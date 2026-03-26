import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Product {
  id: string;
  affiliateLink: string;
  name: string;
  image: string;
  price: string;
  description: string;
}

export interface Store {
  id?: string;
  name: string;
  username: string;
  whatsapp: string;
  niche: string;
}

export interface ContentGenerated {
  id: string;
  productId: string;
  platform: string;
  style: string;
  text: string;
  videoIdea: string;
  callToAction: string;
  shortCall: string;
  date: string;
}

interface AppContextType {
  store: Store | null;
  products: Product[];
  contents: ContentGenerated[];
  clicks: number;
  sales: number;
  selectedNiche: string;
  setSelectedNiche: (niche: string) => void;
  createStore: (store: Store) => void;
  addProduct: (product: Product) => void;
  generateContent: (content: ContentGenerated) => void;
  incrementClicks: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [contents, setContents] = useState<ContentGenerated[]>([]);
  const [clicks, setClicks] = useState(0);
  const [sales, setSales] = useState(0);
  const [selectedNiche, setSelectedNiche] = useState('');

  const createStore = (newStore: Store) => {
    setStore(newStore);
  };

  const addProduct = (product: Product) => {
    setProducts([...products, product]);
  };

  const generateContent = (content: ContentGenerated) => {
    setContents([...contents, content]);
  };

  const incrementClicks = () => {
    setClicks((prev) => prev + 1);
  };

  return (
    <AppContext.Provider
      value={{
        store,
        products,
        contents,
        clicks,
        sales,
        selectedNiche,
        setSelectedNiche,
        createStore,
        addProduct,
        generateContent,
        incrementClicks,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};