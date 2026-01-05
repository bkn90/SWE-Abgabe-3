import { gql } from "@apollo/client";

export const CREATE_BUCH_MUTATION = gql`
  mutation CreateBuch($input: BuchInput!) {
    create(input: $input) {
      id
    }
  }
`;
