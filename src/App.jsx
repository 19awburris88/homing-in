import { useState } from 'react';
import { useHouses } from './state/store';
import { useAuth } from './state/auth';
import BottomNav from './components/BottomNav';
import StorageBanner from './components/StorageBanner';
import SettingsModal from './components/SettingsModal';
import AreaModal from './components/AreaModal';
import Login from './components/Login';
import GalleryView from './views/GalleryView';
import TourDayView from './views/TourDayView';
import CompareView from './views/CompareView';
import HouseForm from './views/HouseForm';

export default function App() {
  const auth = useAuth();
  const store = useHouses();
  const [view, setView] = useState('gallery');
  const [editingHouse, setEditingHouse] = useState(null); // null=closed, {}=new, house=editing
  const [showSettings, setShowSettings] = useState(false);
  const [areaHouseId, setAreaHouseId] = useState(null);

  const areaHouse = areaHouseId ? store.houses.find((h) => h.id === areaHouseId) : null;

  const handleSave = (data) => {
    if (data.id) {
      store.updateHouse(data);
    } else {
      store.addHouse(data);
    }
    setEditingHouse(null);
  };

  // Cloud mode: show a splash while checking the session, then a login gate.
  if (auth.loading) {
    return <div className="app-splash"><span className="app-splash-mark">Homing In</span></div>;
  }
  if (!auth.session) {
    return <Login onSignIn={auth.signIn} error={auth.error} />;
  }

  return (
    <div className="app">
      {view === 'gallery' && (
        <GalleryView
          houses={store.houses}
          settings={store.settings}
          onAdd={() => setEditingHouse({})}
          onEdit={(h) => setEditingHouse(h)}
          onDelete={store.deleteHouse}
          onDuplicate={store.duplicateHouse}
          onUpdateScore={store.updateScore}
          onUpdateNotes={store.updateNotes}
          onOpenArea={(h) => setAreaHouseId(h.id)}
          onSettings={() => setShowSettings(true)}
        />
      )}

      {view === 'tourday' && (
        <TourDayView
          houses={store.houses}
          onToggleToured={store.toggleToured}
        />
      )}

      {view === 'compare' && (
        <CompareView
          houses={store.houses}
          settings={store.settings}
        />
      )}

      <StorageBanner status={store.storageStatus} />
      <BottomNav view={view} onNavigate={setView} />

      {editingHouse !== null && (
        <HouseForm
          house={editingHouse.id ? editingHouse : null}
          onSave={handleSave}
          onCancel={() => setEditingHouse(null)}
        />
      )}

      {areaHouse && (
        <AreaModal
          house={areaHouse}
          onClose={() => setAreaHouseId(null)}
          onRefresh={(id, areaData) => store.updateArea(id, areaData)}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={store.settings}
          onSave={store.updateSettings}
          onClose={() => setShowSettings(false)}
          onSignOut={auth.cloud ? auth.signOut : null}
        />
      )}
    </div>
  );
}
