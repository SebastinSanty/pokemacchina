import { Link, LinkProps } from 'react-router-dom';
import { AppShell, NavLink as MantineNavLink, NavLinkProps as MantineNavLinkProps, Text, Group, Button} from '@mantine/core';
import { IconSettings, IconCode } from '@tabler/icons-react';

import { SignOutButton } from '@clerk/clerk-react'

import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from "@uiw/codemirror-theme-vscode";


// Define the props for the custom NavLink component
interface NavLinkProps extends Omit<MantineNavLinkProps, 'component' | 'href'> {
  to: LinkProps['to'];
}

// Custom NavLink component that combines Mantine's NavLink with React Router's Link
const NavLink: React.FC<NavLinkProps> = ({ to, label, leftSection, ...props }) => {
  return (
    <MantineNavLink
      component={Link}
      to={to}
      label={label}
      leftSection={leftSection}
      {...props}
    />
  );
};

const DashboardPage: React.FC = () => {

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 200,
        breakpoint: 'sm',
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group gap={30} mt={15} ml={15}>
        <Text size="xl" fw={600} >Find the AI: Developer Portal</Text>
        <SignOutButton>
          <Button size="xs" variant="outline" color="gray">Sign Out</Button>
        </SignOutButton>
        </Group>
         
          
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavLink
          to="/dashboard"
          label="Bot Editor"
          leftSection={<IconCode size="1rem" stroke={1.5} />}
        />
        <NavLink
          to="/dashboard/settings"
          label="Bot Settings"
          leftSection={<IconSettings size="1rem" stroke={1.5} />}
          disabled
        />
      </AppShell.Navbar>

      <AppShell.Main>
      
      <CodeMirror 
        height="100px"
        theme={vscodeDark}
      />
      </AppShell.Main>
    </AppShell>
  );
};

export default DashboardPage;
