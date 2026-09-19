export type UatBooking = {
  id: number;
  booking_reference: string;
  guest_id: number;
  room_id: number;
};

type ApiLogin = {
  access_token: string;
};

type Guest = {
  id: number;
  full_name: string;
};

type Room = {
  id: number;
  room_number: string;
  status: string;
};

export function uatHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export function getUatResources(token: string) {
  return cy
    .request<Guest[]>({
      method: "GET",
      url: "/guests",
      headers: uatHeaders(token),
    })
    .then(({ body: guests }) =>
      cy.request<Room[]>({
        method: "GET",
        url: "/rooms",
        headers: uatHeaders(token),
      }).then(({ body: rooms }) => {
        const room = rooms.find(
          (item) =>
            item.status !== "maintenance" &&
            item.status !== "out_of_order",
        );

        if (!guests.length) {
          throw new Error("UAT requires at least one guest.");
        }

        if (!room) {
          throw new Error("UAT requires at least one usable room.");
        }

        return {
          guest: guests[0],
          room,
        };
      }),
    );
}
