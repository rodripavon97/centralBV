import { abrirConSesion, expect, test } from "./fixtures/api";

test.describe("Solicitudes de constancia", () => {
  test("lista activas, busca, ordena y cambia al historial", async ({ page }) => {
    await abrirConSesion(page, "/solicitudes");

    await expect(page.getByRole("heading", { name: "Solicitudes" })).toBeVisible();
    await expect(page.getByRole("link", { name: "SOL-0001", exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Roberto Acosta" })).toBeVisible();
    await expect(page.getByRole("link", { name: "SOL-0005", exact: true })).toHaveCount(0);

    const buscador = page.getByRole("searchbox", { name: "Buscar solicitudes" });
    await buscador.fill("Marta");
    await expect(page).toHaveURL(/q=Marta/);
    await expect(page.getByRole("link", { name: "SOL-0002", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "SOL-0001", exact: true })).toHaveCount(0);

    await page.getByRole("button", { name: /Fecha de alta/ }).click();
    await expect(page).toHaveURL(/orden=asc/);

    await page.getByRole("link", { name: "Historial" }).click();
    await expect(page).toHaveURL(/vista=historial/);
    await expect(page.getByRole("link", { name: "SOL-0005", exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Ana Torres", exact: true })).toBeVisible();
    await expect(page.getByText("Entregada").first()).toBeVisible();
  });

  test("filtra por estado y limpia los resultados vacíos", async ({ page }) => {
    await abrirConSesion(page, "/solicitudes?estado=pendiente");

    await expect(page.getByRole("link", { name: "SOL-0001", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "SOL-0002", exact: true })).toHaveCount(0);

    await page.getByRole("searchbox", { name: "Buscar solicitudes" }).fill("ZZZ");
    await expect(page.getByRole("heading", { name: "Sin resultados" })).toBeVisible();
    await page.getByRole("button", { name: "Limpiar búsqueda" }).click();

    await expect(page).not.toHaveURL(/q=/);
    await expect(page.getByRole("link", { name: "SOL-0001", exact: true })).toBeVisible();
  });

  test("crea una solicitud completa y avisa en la lista", async ({ page }) => {
    await abrirConSesion(page, "/solicitudes/nueva");

    await expect(page.getByRole("heading", { name: "Nueva solicitud" })).toBeVisible();
    await page.locator("#nombre").fill("Nuevo Damnificado");
    await page.locator("#dni").fill("31234567");
    await page.locator("#telefono").fill("1145678901");
    await page.locator("#tipo").selectOption("vivienda");
    await page.locator("#fecha").fill("01/11/2026");
    await page.locator("#hora").fill("09:30");
    await page.locator("#direccion").fill("Calle 123");
    await page.locator("#numeroParte").fill("999");
    await page.locator("#motivo").fill("Inundación");
    await page.locator("#localidad").fill("José C. Paz");
    await page.locator("#partido").fill("José C. Paz");
    await page.locator("#perdidas").fill("Muebles y electrodomésticos");
    await page.locator("#destino").selectOption("seguro");
    await page.locator("#razonSocial").fill("SANCOR SEGUROS");
    await page.locator("#numeroPoliza").fill("POL-999");
    await page.getByRole("button", { name: "Guardar solicitud" }).click();

    await expect(page).toHaveURL(/\/solicitudes$/);
    await expect(page.getByRole("status").filter({ hasText: "SOL-0007 creada con estado Pendiente" })).toBeVisible();
    await expect(page.getByRole("link", { name: "SOL-0007", exact: true })).toBeVisible();
  });

  test("valida los campos obligatorios de una solicitud nueva", async ({ page }) => {
    await abrirConSesion(page, "/solicitudes/nueva");

    await page.getByRole("button", { name: "Guardar solicitud" }).click();

    await expect(page.getByRole("alert")).toContainText(/Revis. .* campos? antes de guardar/);
    await expect(page.locator("#nombre")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#dni")).toHaveAttribute("aria-invalid", "true");
    await expect(page).toHaveURL(/\/solicitudes\/nueva$/);
  });

  test("edita una solicitud pendiente", async ({ page }) => {
    await abrirConSesion(page, "/solicitudes/sol-1/editar");

    await expect(page.getByRole("heading", { name: "Editar solicitud" })).toBeVisible();
    await expect(page.locator("#nombre")).toHaveValue("Roberto Acosta");
    await page.locator("#nombre").fill("Roberto Acosta Editado");
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(page).toHaveURL(/\/solicitudes\/sol-1$/);
    await expect(page.getByRole("status").filter({ hasText: "Cambios guardados" })).toBeVisible();
    await expect(page.getByText("Roberto Acosta Editado")).toBeVisible();
  });

  test("no permite editar una solicitud que ya no está pendiente", async ({ page }) => {
    await abrirConSesion(page, "/solicitudes/sol-2/editar");

    await expect(page.getByRole("heading", { name: /no se puede editar/ })).toBeVisible();
    await page.getByRole("link", { name: "Ver solicitud" }).click();
    await expect(page).toHaveURL(/\/solicitudes\/sol-2$/);
  });

  test("cancela una solicitud pendiente con motivo", async ({ page }) => {
    await abrirConSesion(page, "/solicitudes/sol-1");

    await page.getByRole("button", { name: "Cancelar solicitud" }).click();
    const dialogo = page.getByRole("dialog", { name: /Cancelar la solicitud/ });
    await expect(dialogo).toBeVisible();
    await dialogo.locator("#motivo").fill("Pedido duplicado");
    await dialogo.getByRole("button", { name: /cancelar solicitud/ }).click();

    await expect(page.getByText("Solicitud cancelada")).toBeVisible();
    await expect(page.getByText("Motivo: Pedido duplicado")).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancelar solicitud" })).toBeDisabled();
  });

  test("genera la constancia, descarga el PDF, imprime y la marca como firmada", async ({ page }) => {
    await abrirConSesion(page, "/solicitudes/sol-1/generar");

    await expect(page.getByRole("heading", { name: "Generar constancia" })).toBeVisible();
    await page.locator("#observaciones").fill("Se agrega una nota al pie.");
    await page.getByRole("button", { name: "Guardar constancia" }).click();

    await expect(page.getByRole("heading", { name: /Constancia N/ })).toBeVisible();
    await expect(page.getByText("Se agrega una nota al pie.").first()).toBeVisible();

    const descarga = page.waitForEvent("download");
    await page.getByRole("button", { name: /Descargar PDF/ }).click();
    const archivo = await descarga;
    expect(archivo.suggestedFilename()).toBe("constancia.pdf");
    await expect(page.getByRole("status").filter({ hasText: /PDF descargado/ })).toBeVisible();

    await page.getByRole("button", { name: "Imprimir", exact: true }).click();
    const imprimir = page.getByRole("dialog", { name: "Imprimir" });
    await expect(imprimir).toBeVisible();
    await imprimir.getByRole("button", { name: "Cancelar" }).click();
    await expect(imprimir).toBeHidden();

    await page.getByRole("button", { name: "Marcar como firmada" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Constancia marcada como firmada" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Marcar como firmada" })).toHaveCount(0);
  });

  test("registra el pago pendiente y entrega la constancia", async ({ page }) => {
    await abrirConSesion(page, "/solicitudes/sol-3");

    await expect(page.getByText(/Entrega bloqueada/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Marcar como entregada" })).toBeDisabled();

    await page.getByRole("button", { name: "Registrar pago" }).click();
    const pago = page.getByRole("dialog", { name: /Registrar pago/ });
    await expect(pago).toBeVisible();
    await pago.locator("#pago-monto").fill("12000");
    await pago.locator("#pago-metodoPago").selectOption("efectivo");
    await pago.getByRole("button", { name: "Guardar pago" }).click();

    await expect(page.getByRole("status").filter({ hasText: "Pago guardado" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Marcar como entregada" })).toBeEnabled();

    await page.getByRole("button", { name: "Marcar como entregada" }).click();
    const entrega = page.getByRole("dialog", { name: "Marcar como entregada" });
    await expect(entrega.locator("#entrega-nombreCompleto")).toHaveValue("Lucía Fernández");
    await entrega.getByRole("button", { name: "Confirmar entrega" }).click();

    await expect(page).toHaveURL(/\/solicitudes$/);
    await expect(page.getByRole("status").filter({ hasText: "entregada" })).toBeVisible();
    await expect(page.getByRole("link", { name: "SOL-0003", exact: true })).toHaveCount(0);
  });

  test("muestra no encontrada para una solicitud inexistente", async ({ page }) => {
    await abrirConSesion(page, "/solicitudes/no-existe");

    await expect(page.getByRole("heading", { name: "No encontramos la solicitud" })).toBeVisible();
    await page.getByRole("link", { name: "Volver a solicitudes" }).click();
    await expect(page).toHaveURL(/\/solicitudes$/);
  });

  test("una solicitud cancelada no permite generar constancia", async ({ page }) => {
    await abrirConSesion(page, "/solicitudes/sol-6/generar");

    await expect(page.getByRole("heading", { name: /solicitud est. cancelada/ })).toBeVisible();
    await page.getByRole("link", { name: "Ver solicitud" }).click();
    await expect(page).toHaveURL(/\/solicitudes\/sol-6$/);
    await expect(page.getByText("Solicitud cancelada")).toBeVisible();
  });
});
