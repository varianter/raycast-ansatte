import { useEffect, useState } from "react";
import { ActionPanel, Action, Grid, showToast, Toast } from "@raycast/api";
import { useFetch } from "@raycast/utils";

type EmployeeItem = {
  name: string;
  email: string;
  telephone: string | null;
  imageUrl: string;
  officeName: string;
};

const BASE_URL = "https://chewie-webapp-ld2ijhpvmb34c.azurewebsites.net";

export default function Command() {
  const [itemSize, setItemSize] = useState<Grid.ItemSize>(Grid.ItemSize.Large);
  const [office, setOffice] = useState("all");

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

  const offices = ["Trondheim", "Oslo", "Bergen", "Stockholm"];

  return (
    <Grid
      itemSize={itemSize}
      inset={Grid.Inset.Large}
      isLoading={isLoading}
      searchBarAccessory={
        <Grid.Dropdown
          tooltip="Velg kontor"
          onChange={(newValue) => {
            setOffice(newValue);
          }}
        >
          <Grid.Dropdown.Item title={"Alle"} value={"all"} />

          {offices.map((office) => (
            <Grid.Dropdown.Item title={office} value={office} key={office} />
          ))}
        </Grid.Dropdown>
      }
    >
      {!isLoading &&
        data?.employees
          .sort((a, b) => a.name.localeCompare(b.name))
          .filter((employee) => (office === "all" ? true : employee.officeName === office))
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
                  {employee.telephone ?? (
                    <Action.CopyToClipboard
                      content={employee.telephone || ""}
                      title="Kopier Telefonnummer Til Utklippstavle"
                      shortcut={{ modifiers: ["cmd"], key: "t" }}
                    />
                  )}
                  <ActionPanel.Submenu title="Endre Bildestørrelse">
                    <Action title="Lite" onAction={() => setItemSize(Grid.ItemSize.Small)} />
                    <Action title="Middels" onAction={() => setItemSize(Grid.ItemSize.Medium)} />
                    <Action title="Stort" onAction={() => setItemSize(Grid.ItemSize.Large)} />
                  </ActionPanel.Submenu>
                </ActionPanel>
              }
            />
          ))}
    </Grid>
  );
}
