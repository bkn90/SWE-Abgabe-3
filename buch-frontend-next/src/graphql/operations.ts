import { gql } from "@apollo/client";

// LOGIN (Schema: token(username,password) -> TokenPayload)
export const TOKEN_MUTATION = gql`
  mutation Token($username: String!, $password: String!) {
    token(username: $username, password: $password) {
      access_token
      refresh_token
      expires_in
      refresh_expires_in
    }
  }
`;

// SEARCH (Schema: buecher(suchparameter) -> [Buch!])
export const BUECHER_QUERY = gql`
  query Buecher($suchparameter: SuchparameterInput) {
    buecher(suchparameter: $suchparameter) {
      id
      isbn
      rating
      art
      preis
      lieferbar
      datum
      homepage
      schlagwoerter
      titel {
        titel
        untertitel
      }
      rabatt
      version
    }
  }
`;

// DETAIL (Schema: buch(id) -> Buch)
export const BUCH_QUERY = gql`
  query Buch($id: ID!) {
    buch(id: $id) {
      id
      isbn
      rating
      art
      preis
      lieferbar
      datum
      homepage
      schlagwoerter
      titel {
        titel
        untertitel
      }
      rabatt
      version
    }
  }
`;

// CREATE (Schema: create(input: BuchInput!) -> CreatePayload { id })
export const CREATE_BUCH_MUTATION = gql`
  mutation CreateBuch($input: BuchInput!) {
    create(input: $input) {
      id
    }
  }
`;
