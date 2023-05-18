import { useEffect, useState } from "react";
import {
  ActionPanel,
  Action,
  Grid,
  showToast,
  Toast,
  Clipboard,
  Detail,
  Icon,
} from "@raycast/api";
import { useCachedState, useFetch } from "@raycast/utils";
import downloadTempImage from "./utils/downloadTempImage";

type EmployeeItem = {
  name: string;
  email: string;
  telephone: string | null;
  imageUrl: string;
  officeName: string;
  startDate: string;
};

const BASE_URL = "https://chewie-webapp-ld2ijhpvmb34c.azurewebsites.net";

const offices = ["Alle", "Trondheim", "Oslo", "Bergen", "Stockholm", "Göteborg"] as const;
type Office = (typeof offices)[number];

const columnChoices = [3, 4, 5, 6] as const;
type Columns = (typeof columnChoices)[number];

export default function Command() {
  const [columns, setColumns] = useCachedState<Columns>("columns", 5);
  const [office, setOffice] = useCachedState<Office>("office", "Alle");
  const [startDateFilter, setStartDateFilter] = useState<Date>();

  const { data, error, isLoading } = useFetch<{ employees: EmployeeItem[] }>(
    `${BASE_URL}/employees`
  );

  const employees = sortAndFilterEmployees(data?.employees ?? [], office);

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
      navigationTitle={`Viser ${employees.length} ansatte`}
      searchBarPlaceholder="Søk etter ansatt"
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
      {employees.length ? (
        employees.filter((employee) => (startDateFilter ? new Date(employee.startDate) >= startDateFilter : true))
          .map((employee) => (
          <Grid.Item
            key={employee.name}
            content={{
              value: { source: employee.imageUrl },
              tooltip: employee.name,
            }}
            title={employee.name}
            keywords={[employee.officeName, employee.email]}
            subtitle={employee.officeName}
            actions={
              <ActionPanel>
                <Action.Push
                  target={<Employee employee={employee} />}
                  title="Se info"
                  shortcut={{ modifiers: ["cmd"], key: "i" }}
                  icon={Icon.MagnifyingGlass}
                />
                <Action.CopyToClipboard
                  content={employee.email}
                  title="Kopier e-post"
                  shortcut={{ modifiers: ["cmd"], key: "e" }}
                />
                <Action.PickDate
                    onChange={(date) => date !== null && setStartDateFilter(date)}
                    title="Filtrer på startdato"
                    shortcut={{ modifiers: ["cmd"], key: "s" }}
                  />
                  <Action.CopyToClipboard
                  content={employee.name}
                  title="Kopier navn"
                  shortcut={{ modifiers: ["cmd"], key: "n" }}
                />
                {employee.telephone !== null && (
                  <Action.CopyToClipboard
                    content={employee.telephone}
                    title="Kopier telefonnummer"
                    shortcut={{ modifiers: ["cmd"], key: "t" }}
                  />
                )}
                <Action.CopyToClipboard
                  content={employee.imageUrl}
                  title="Kopier bilde"
                  shortcut={{ modifiers: ["cmd"], key: "b" }}
                  onCopy={async (content) => {
                    const image = await downloadTempImage(
                      content.toString(),
                      employee.name
                    );
                    Clipboard.copy({ file: image });
                  }}
                  />
                  <Action.CopyToClipboard
                    content={`Navn: ${employee.name}\nE-post: ${employee.email}\nTelefon: ${employee.telephone || ""}`}
                    title="Kopier alt"
                    shortcut={{ modifiers: ["cmd"], key: "s" }}
                />
                <ActionPanel.Submenu
                  title="Sett antall kolonner"
                  icon={Icon.AppWindowGrid3x3}
                >
                  {columnChoices.map((choice) => (
                    <Action
                      key={choice}
                      title={choice.toString()}
                      onAction={() => setColumns(choice)}
                    />
                  ))}
                </ActionPanel.Submenu>
              </ActionPanel>
            }
          />
        ))
      ) : (
        <Grid.EmptyView title="Kunne ikke hente ansatte" />
      )}
    </Grid>
  );
}

function Employee({ employee }: { employee: EmployeeItem }) {
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const flag = employee.officeName === "Stockholm" ? "🇸🇪" : "🇳🇴";

  return (
    <Detail
      markdown={`<img src="${employee.imageUrl}" alt="" height="350">`}
      navigationTitle={employee.name}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Navn" text={employee.name} />
          <Detail.Metadata.Label title="E-post" text={employee.email} />
          {employee.telephone !== null && (
            <Detail.Metadata.Label
              title="Telefonnummer"
              text={employee.telephone}
            />
          )}
          <Detail.Metadata.Label
            title="Startdato"
            text={new Date(employee.startDate).toLocaleDateString(
              "nb-NO",
              dateOptions
            )}
          />
          <Detail.Metadata.Label
            title="Kontor"
            text={`${flag} ${employee.officeName}`}
          />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            content={employee.email}
            title="Kopier e-post"
            shortcut={{ modifiers: ["cmd"], key: "e" }}
          />
          <Action.CopyToClipboard
            content={employee.name}
            title="Kopier navn"
            shortcut={{ modifiers: ["cmd"], key: "n" }}
          />
          {employee.telephone != null && (
            <Action.CopyToClipboard
              content={employee.telephone || ""}
              title="Kopier telefonnummer"
              shortcut={{ modifiers: ["cmd"], key: "t" }}
            />
          )}
          <Action.CopyToClipboard
            content={employee.imageUrl}
            title="Kopier bilde"
            shortcut={{ modifiers: ["cmd"], key: "b" }}
            onCopy={async (content) => {
              const image = await downloadTempImage(
                content.toString(),
                employee.name
              );
              Clipboard.copy({ file: image });
            }}
          />
        </ActionPanel>
      }
    />
  );
}

function sortAndFilterEmployees(
  employees: EmployeeItem[],
  office: Office
): EmployeeItem[] {
  return employees
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((employee) =>
      office === "Alle" ? true : employee.officeName === office
    );
}
