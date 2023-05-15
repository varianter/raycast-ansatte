import { useEffect } from "react";
import { ActionPanel, Action, Grid, showToast, Toast } from "@raycast/api";
import { useCachedState, useFetch } from "@raycast/utils";

type EmployeeItem = {
  name: string;
  email: string;
  telephone: string | null;
  imageUrl: string;
  officeName: string;
};

const BASE_URL = "https://chewie-webapp-ld2ijhpvmb34c.azurewebsites.net";

const offices = ["Alle", "Trondheim", "Oslo", "Bergen", "Stockholm"] as const;
type Office = (typeof offices)[number];

const columnChoices = [1, 2, 3, 4, 5, 6, 7, 8] as const;
type Columns = (typeof columnChoices)[number];

export default function Command() {
  const [columns, setColumns] = useCachedState<Columns>("columns", 5);
  const [office, setOffice] = useCachedState<Office>("office", "Alle");

  const { data, error, isLoading } = useFetch<{ employees: EmployeeItem[] }>(`${BASE_URL}/employees`);

  useEffect(() => {
    if (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Kunne ikke hente ansatte!",
        message: error.message,
      });
    }
  }, [error]);

  return (
    <Grid
      columns={columns}
      inset={Grid.Inset.Large}
      isLoading={isLoading}
      searchBarAccessory={
        <Grid.Dropdown
          tooltip="Velg kontor"
          onChange={(newValue) => {
            setOffice(newValue as Office);
          }}
        >
          {offices.map((office) => (
            <Grid.Dropdown.Item title={office} value={office} key={office} />
          ))}
        </Grid.Dropdown>
      }
    >
      {!isLoading &&
        data?.employees
          .sort((a, b) => a.name.localeCompare(b.name))
          .filter((employee) => (office === "Alle" ? true : employee.officeName === office))
          .map((employee) => (
            <Grid.Item
              key={employee.name}
              content={{ value: { source: employee.imageUrl }, tooltip: employee.name }}
              title={employee.name}
              keywords={[employee.officeName, employee.email]}
              subtitle={employee.officeName}
              actions={
                <ActionPanel>
                  <Action.CopyToClipboard
                    content={employee.email}
                    title="Kopier E-Post Til Utklippstavle"
                    shortcut={{ modifiers: ["cmd"], key: "e" }}
                  />
                  <Action.CopyToClipboard
                    content={employee.name}
                    title="Kopier Navn Til Utklippstavle"
                    shortcut={{ modifiers: ["cmd"], key: "n" }}
                  />
                  {employee.telephone != null && (
                    <Action.CopyToClipboard
                      content={employee.telephone || ""}
                      title="Kopier Telefonnummer Til Utklippstavle"
                      shortcut={{ modifiers: ["cmd"], key: "t" }}
                    />
                  )}
                  <ActionPanel.Submenu title="Sett Antall Kolonner">
                    {columnChoices.map((choice) => (
                      <Action key={choice} title={choice.toString()} onAction={() => setColumns(choice)} />
                    ))}
                  </ActionPanel.Submenu>
                </ActionPanel>
              }
            />
          ))}
    </Grid>
  );
}
