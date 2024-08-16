import { MantineProvider} from '@mantine/core';
import Editor from './components/Editor';

import './App.css';

function App() {

  return (
    <MantineProvider>
      <Editor />
    </MantineProvider>
  );
}

export default App;
