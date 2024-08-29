/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";
import Actions from "../views/Actions.js";

jest.mock("../__mocks__/store", () => ({
  bills: () => ({
    list: jest.fn().mockResolvedValue([
      {
        id: "47qAXb6fIm2zOKkLzMro",
        vat: "80",
        fileUrl:
          "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
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
      },
      {
        id: "UIUZtnPQvnbFnB0ozvJh",
        vat: "60",
        fileUrl:
          "https://test.storage.tld/v0/b/billable-677b6.a…dur.png?alt=media&token=571d34cb-9c8f-430a-af52-66221cae1da3",
        status: "accepted",
        type: "Services en ligne",
        commentary: "",
        name: "test3",
        fileName:
          "facture-client-php-exportee-dans-document-pdf-enregistre-sur-disque-dur.png",
        date: "2003-03-03",
        amount: 300,
        commentAdmin: "bon bah d'accord",
        email: "a@a",
        pct: 20,
      },
      {
        id: "BeKy5Mo4jkmdfPGYpTxZ",
        vat: "",
        amount: 100,
        name: "test1",
        fileName: "1592770761.jpeg",
        commentary: "plop",
        pct: 20,
        type: "Transports",
        email: "a@a",
        fileUrl:
          "https://test.storage.tld/v0/b/billable-677b6.a…61.jpeg?alt=media&token=7685cd61-c112-42bc-9929-8a799bb82d8b",
        date: "2001-01-01",
        status: "refused",
        commentAdmin: "en fait non",
      },
      {
        id: "qcCK3SzECmaZAGRrHjaC",
        status: "refused",
        pct: 20,
        amount: 200,
        email: "a@a",
        name: "test2",
        vat: "40",
        fileName: "preview-facture-free-201801-pdf-1.jpg",
        date: "2002-02-02",
        commentAdmin: "pas la bonne facture",
        commentary: "test2",
        type: "Restaurants et bars",
        fileUrl:
          "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=4df6ed2c-12c8-42a2-b013-346c1346f732",
      },
    ]),
  }),
}));

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
    document.body.innerHTML = `<div id="root"></div>`;
    router();
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = "";
  });

  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      expect(windowIcon.classList.contains("active-icon")).toBeTruthy();
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    describe("When I click on the New Bill button", () => {
      test("Then it should navigate to NewBill page", () => {
        document.body.innerHTML = BillsUI({ data: bills });
        const onNavigate = jest.fn();
        const billsContainer = new Bills({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        });

        const handleClickNewBill = jest.fn(billsContainer.handleClickNewBill);
        const buttonNewBill = screen.getByTestId("btn-new-bill");
        buttonNewBill.addEventListener("click", handleClickNewBill);
        fireEvent.click(buttonNewBill);

        expect(handleClickNewBill).toHaveBeenCalled();
        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.NewBill);
      });
    });

    describe("When I click on the eye icon of a bill", () => {
      test("Then a modal should open", async () => {
        document.body.innerHTML = BillsUI({ data: bills });
        const onNavigate = () => {};
        $.fn.modal = jest.fn(); // Mock jQuery modal function

        const billsContainer = new Bills({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        });

        // Correctement obtenir l'élément icon-eye
        const iconEye = screen.getAllByTestId("icon-eye")[0];

        // Assurez-vous que l'élément est valide et a un attribut data-bill-url
        expect(iconEye).toBeTruthy();
        expect(iconEye.getAttribute("data-bill-url")).toBe(
          "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a"
        );

        // Simuler un clic sur l'icône de l'œil
        fireEvent.click(iconEye);

        // Vérifier que la modal est appelée
        expect($.fn.modal).toHaveBeenCalledWith("show");
      });
    });

    describe("When I get bills", () => {
      test("Then it should fetch bills from mock API GET", async () => {
        const onNavigate = () => {};
        const billsContainer = new Bills({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });
        const bills = await billsContainer.getBills();
        expect(bills.length).toBe(4);
        expect(bills[0].id).toBe("47qAXb6fIm2zOKkLzMro");
        expect(bills[1].id).toBe("UIUZtnPQvnbFnB0ozvJh");
      });
    });
  });
});
