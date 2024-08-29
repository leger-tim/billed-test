/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    // Mock the localStorage to simulate a connected employee user
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
    document.body.innerHTML = `<div id="root"></div>`;
    router();
    window.onNavigate(ROUTES_PATH.NewBill);
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = "";
  });

  describe("When I am on NewBill page", () => {
    test("Then the mail icon should be highlighted", async () => {
      // Vérifie que l'icône du courrier dans la barre latérale est mise en évidence lorsque l'utilisateur est sur la page NewBill
      await waitFor(() => screen.getByTestId("icon-mail"));
      const windowIcon = screen.getByTestId("icon-mail");
      expect(windowIcon.classList.contains("active-icon")).toBeTruthy();
    });

    test("Then the form should render correctly", () => {
      // Vérifie que tous les champs de saisie et le formulaire sont correctement rendus sur la page NewBill
      document.body.innerHTML = NewBillUI();
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
      expect(screen.getByTestId("expense-type")).toBeTruthy();
      expect(screen.getByTestId("expense-name")).toBeTruthy();
      expect(screen.getByTestId("datepicker")).toBeTruthy();
      expect(screen.getByTestId("amount")).toBeTruthy();
      expect(screen.getByTestId("vat")).toBeTruthy();
      expect(screen.getByTestId("pct")).toBeTruthy();
      expect(screen.getByTestId("commentary")).toBeTruthy();
      expect(screen.getByTestId("file")).toBeTruthy();
    });

    describe("When I upload a file with a valid image format", () => {
      test("Then the file name should be displayed in the input", async () => {
        // Simule le téléchargement d'un fichier image valide et vérifie que le nom du fichier est correctement affiché
        document.body.innerHTML = NewBillUI();
        const newBill = new NewBill({
          document,
          onNavigate: () => {},
          store: mockStore,
          localStorage: window.localStorage,
        });

        const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
        const file = screen.getByTestId("file");
        file.addEventListener("change", handleChangeFile);

        fireEvent.change(file, {
          target: {
            files: [new File(["file.png"], "file.png", { type: "image/png" })],
          },
        });

        expect(handleChangeFile).toHaveBeenCalled();
        await waitFor(() => expect(newBill.fileName).toBe("file.png"));
      });
    });

    describe("When I upload a file with an invalid format", () => {
      test("Then an alert should be displayed and the file input should be cleared", async () => {
        // Simule le téléchargement d'un fichier avec un format invalide et vérifie qu'une alerte est affichée et que l'entrée du fichier est effacée
        document.body.innerHTML = NewBillUI();
        window.alert = jest.fn();

        const newBill = new NewBill({
          document,
          onNavigate: () => {},
          store: mockStore,
          localStorage: window.localStorage,
        });

        const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
        const file = screen.getByTestId("file");
        file.addEventListener("change", handleChangeFile);

        fireEvent.change(file, {
          target: {
            files: [
              new File(["file.pdf"], "file.pdf", { type: "application/pdf" }),
            ],
          },
        });

        expect(handleChangeFile).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalledWith(
          "Invalid file type. Please upload an image file (jpg, jpeg, or png)."
        );
        await waitFor(() => expect(file.value).toBe(""));
        await waitFor(() => expect(newBill.fileName).toBe(null));
      });
    });

    describe("When I submit the form with valid data", () => {
      test("Then handleSubmit should be called", () => {
        // Simule la soumission du formulaire avec des données valides et vérifie que handleSubmit est appelé
        document.body.innerHTML = NewBillUI();
        const newBill = new NewBill({
          document,
          onNavigate: () => {},
          store: mockStore,
          localStorage: window.localStorage,
        });

        const handleSubmit = jest.fn(newBill.handleSubmit);
        const form = screen.getByTestId("form-new-bill");
        form.addEventListener("submit", handleSubmit);

        fireEvent.submit(form);
        expect(handleSubmit).toHaveBeenCalled();
      });
    });
  });
});

// POST
describe("When I navigate to Dashboard employee", () => {
  describe("Given I am a user connected as Employee, and a user posts a new Bill", () => {
    test("Then it should add a bill through the mock API POST", async () => {
      // Teste la requête POST pour ajouter une nouvelle facture via l'API mockée et vérifie la réponse
      const postSpy = jest.spyOn(mockStore, "bills");
      const bill = {
        id: "47qAXb6fIm2zOKkLzMro",
        vat: "80",
        fileUrl:
          "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
        status: "pending",
        type: "Hôtel et logement",
        commentary: "séminaire billed",
        name: "encore",
        fileName: "preview-facture-free-201801-pdf-1.jpg",
        date: "2004-04-04",
        amount: 400,
        commentAdmin: "ok",
        email: "a@a",
        pct: 20,
      };
      const postBills = await mockStore.bills().update(bill);
      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(postBills).toStrictEqual(bill);
    });

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        // Prépare l'environnement pour tester les erreurs d'API en initialisant le localStorage et en rendant l'interface utilisateur de NewBill
        window.localStorage.setItem(
          "user",
          JSON.stringify({ type: "Employee" })
        );
        document.body.innerHTML = NewBillUI();
      });

      test("Then, if the API returns a 404 error, it should display a 404 error in the console", async () => {
        // Simule le comportement de l'application lorsque l'API renvoie une erreur 404 lors de la soumission d'une nouvelle facture
        const postSpy = jest.spyOn(console, "error");

        // Mock d'un store avec une méthode bills qui rejette une promesse avec une erreur 404
        const store = {
          bills: jest.fn(() => ({
            update: jest.fn().mockRejectedValue(new Error("404")),
          })),
          create: jest.fn(() => Promise.resolve({})),
        };

        // Crée une nouvelle instance de NewBill avec le store mocké
        const newBill = new NewBill({
          document,
          onNavigate: jest.fn(),
          store,
          localStorage,
        });

        // Simule la soumission du formulaire et vérifie que l'erreur est capturée dans la console
        const form = screen.getByTestId("form-new-bill");
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
        form.addEventListener("submit", handleSubmit);
        fireEvent.submit(form);

        // Attend que la promesse soit rejetée et vérifie que l'erreur 404 a été loggée dans la console
        await new Promise(process.nextTick);
        expect(postSpy).toBeCalledWith(new Error("404"));
      });

      test("Then, if the API returns a 500 error, it should display a 500 error in the console", async () => {
        // Simule le comportement de l'application lorsque l'API renvoie une erreur 500 lors de la soumission d'une nouvelle facture
        const postSpy = jest.spyOn(console, "error");

        // Mock d'un store avec une méthode bills qui rejette une promesse avec une erreur 500
        const store = {
          bills: jest.fn(() => ({
            update: jest.fn().mockRejectedValue(new Error("500")),
          })),
          create: jest.fn(() => Promise.resolve({})),
        };

        // Crée une nouvelle instance de NewBill avec le store mocké
        const newBill = new NewBill({
          document,
          onNavigate: jest.fn(),
          store,
          localStorage,
        });

        // Simule la soumission du formulaire et vérifie que l'erreur est capturée dans la console
        const form = screen.getByTestId("form-new-bill");
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
        form.addEventListener("submit", handleSubmit);
        fireEvent.submit(form);

        // Attend que la promesse soit rejetée et vérifie que l'erreur 500 a été loggée dans la console
        await new Promise(process.nextTick);
        expect(postSpy).toBeCalledWith(new Error("500"));
      });
    });
  });
});
