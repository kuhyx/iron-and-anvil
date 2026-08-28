import { useCallback, useState } from 'react';
import { ModeSelect, type MechanicMode } from './ui/mode-select';
import { SweetSpotScreen } from './ui/mechanics/sweet-spot-screen';
import { ShapeSculptScreen } from './ui/mechanics/shape-sculpt-screen';
import { MeterJuggleScreen } from './ui/mechanics/meter-juggle-screen';
import { TurnResolutionScreen } from './ui/mechanics/turn-resolution-screen';

type Screen = 'menu' | MechanicMode;

function App() {
  const [screen, setScreen] = useState<Screen>('menu');

  const backToMenu = useCallback(() => {
    setScreen('menu');
  }, []);

  return (
    <main>
      <h1>Iron and Anvil</h1>
      <p>Mechanic bake-off — choose a smithing mini-game to try.</p>

      {screen === 'menu' ? <ModeSelect onSelect={setScreen} /> : undefined}
      {screen === 'sweetSpot' ? <SweetSpotScreen onBackToMenu={backToMenu} /> : undefined}
      {screen === 'shapeSculpt' ? <ShapeSculptScreen onBackToMenu={backToMenu} /> : undefined}
      {screen === 'meterJuggle' ? <MeterJuggleScreen onBackToMenu={backToMenu} /> : undefined}
      {screen === 'turnResolution' ? <TurnResolutionScreen onBackToMenu={backToMenu} /> : undefined}
    </main>
  );
}

export default App;
